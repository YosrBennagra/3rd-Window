import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { listen } from '@tauri-apps/api/event';
import { useGridStore } from '../../../application/stores/gridStore';
import { useStore } from '../../../application/stores/store';
import { spawnDesktopWidget } from '../../../infrastructure/ipc/desktop-widgets';
import { useRenderTracking } from '../../../utils/performanceMonitoring';
import { GridGhost } from './GridGhost';
import { GridCells } from './GridCells';
import useGridDrag from './useGridDrag';
import { useWidgetResize } from './useWidgetResize';
import type { ResizeHandle } from './useWidgetResize';
import './DraggableGrid.css';
import { GridWidgetItem } from './GridWidgetItem';
import { GridContextMenu, type ContextMenuState, type MenuAction } from '../ui/GridContextMenu';
import type { WidgetLayout } from '../../../domain/models/layout';
import { clampToRange } from './gridMath';
import { widgetRegistry } from '../../../config/widgetRegistry';
import { executeMenuAction, type MenuActionContext } from '../../../application/services/menuActions';
import { registerCoreWidgets } from '../../../config/widgetPluginBootstrap';

const GAP_SIZE = 12;

export function DraggableGrid() {
  // Performance tracking
  useRenderTracking('DraggableGrid');

  const {
    widgets,
    grid,
    isLoaded,
    moveWidget,
    resizeWidget,
    removeWidget,
    addWidget,
    debugGrid,
    toggleDebugGrid,
    getConstraints,
    setWidgetLock,
  } = useGridStore();
  const setFullscreen = useStore((state) => state.setFullscreen);
  const settingsState = useStore((state) => state.settings);

  const gridRef = useRef<HTMLDivElement | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const getGridMetrics = useCallback(() => {
    const gridElement = gridRef.current;
    if (!gridElement) return null;

    const rect = gridElement.getBoundingClientRect();
    const style = getComputedStyle(gridElement);

    const paddingLeft = parseFloat(style.paddingLeft || '0') || 0;
    const paddingRight = parseFloat(style.paddingRight || '0') || 0;
    const paddingTop = parseFloat(style.paddingTop || '0') || 0;
    const paddingBottom = parseFloat(style.paddingBottom || '0') || 0;
    const columnGap = parseFloat(style.columnGap || `${GAP_SIZE}`) || GAP_SIZE;
    const rowGap = parseFloat(style.rowGap || `${GAP_SIZE}`) || GAP_SIZE;

    const innerWidth = Math.max(0, rect.width - paddingLeft - paddingRight);
    const innerHeight = Math.max(0, rect.height - paddingTop - paddingBottom);
    const cellWidth = (innerWidth - columnGap * (grid.columns - 1)) / grid.columns;
    const cellHeight = (innerHeight - rowGap * (grid.rows - 1)) / grid.rows;

    return {
      rect,
      paddingLeft,
      paddingTop,
      cellWidth,
      cellHeight,
      columnGap,
      rowGap,
    };
  }, [grid.columns, grid.rows]);

  const getCellFromPointer = useCallback(
    (clientX: number, clientY: number, size?: { width: number; height: number }) => {
      const metrics = getGridMetrics();
      if (!metrics) return { x: 0, y: 0 };

      const { rect, paddingLeft, paddingTop, cellWidth, cellHeight, columnGap, rowGap } = metrics;
      if (cellWidth <= 0 || cellHeight <= 0) return { x: 0, y: 0 };

      const x = clampToRange(clientX - rect.left - paddingLeft, 0, Math.max(0, rect.width));
      const y = clampToRange(clientY - rect.top - paddingTop, 0, Math.max(0, rect.height));

      const colStride = cellWidth + columnGap;
      const rowStride = cellHeight + rowGap;

      const maxX = grid.columns - (size?.width ?? 1);
      const maxY = grid.rows - (size?.height ?? 1);

      return {
        x: clampToRange(Math.floor(x / colStride), 0, maxX),
        y: clampToRange(Math.floor(y / rowStride), 0, maxY),
      };
    },
    [getGridMetrics, grid.columns, grid.rows],
  );

  const {
    dragInfo,
    ghostStyle,
    dragStyle,
    preview: dragPreview,
    isDragBlocked,
    handleWidgetPointerDown,
    cancelDrag,
  } = useGridDrag({
    widgets,
    moveWidget,
    getCellFromPointer,
  });

  const {
    resizingWidgetId,
    preview: resizePreview,
    isResizeBlocked,
    beginResize,
    cancelResize: cancelResizeMode,
    handleResizePointerDown,
  } = useWidgetResize({
    grid,
    widgets,
    resizeWidget,
    getCellFromPointer: (x: number, y: number) => getCellFromPointer(x, y, undefined),
    getConstraints,
  });

  const previewArea = resizePreview ?? dragPreview;
  const isBlocked = isDragBlocked || isResizeBlocked;

  const handleWidgetPointerDownSafe = useCallback(
    (e: React.PointerEvent, widget: WidgetLayout) => {
      if (widget.locked) return;
      if (resizingWidgetId) return;
      handleWidgetPointerDown(e, widget);
    },
    [handleWidgetPointerDown, resizingWidgetId],
  );

  const handleResizePointerDownSafe = useCallback(
    (e: React.PointerEvent, widget: WidgetLayout, handle: ResizeHandle) => {
      if (widget.locked) return;
      handleResizePointerDown(e, widget, handle);
    },
    [handleResizePointerDown],
  );
  const handleContextMenu = useCallback((e: React.MouseEvent, widget: WidgetLayout | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, widget });
  }, []);

  const handleGridContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.grid-widget')) return;
    if (resizingWidgetId) {
      cancelResizeMode();
    }
    handleContextMenu(e, null);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleMenuAction = (action: MenuAction, widget?: WidgetLayout | null) => {
    const context: MenuActionContext = {
      widget,
      settingsState,
      resizingWidgetId,
      setFullscreen,
      beginResize,
      toggleDebugGrid,
      removeWidget,
      setWidgetLock,
      cancelResizeMode,
      openWidgetPicker,
      openSettingsWindow,
      handlePopOutWidget,
    };
    
    void executeMenuAction(action, context);
  };

  const handlePopOutWidget = async (widget: WidgetLayout) => {
    try {
      const metrics = getGridMetrics();
      if (!metrics) return;

      // Calculate pixel position and size from grid coordinates
      const { cellWidth, cellHeight, columnGap, rowGap } = metrics;
      const pixelWidth = Math.round(widget.width * cellWidth + (widget.width - 1) * columnGap);
      const pixelHeight = Math.round(widget.height * cellHeight + (widget.height - 1) * rowGap);

      // Default desktop position (center of screen, or where the widget currently is)
      const screenX = Math.round(window.screenX + 100);
      const screenY = Math.round(window.screenY + 100);

      await spawnDesktopWidget({
        widgetId: widget.id,
        widgetType: widget.widgetType,
        x: screenX,
        y: screenY,
        width: Math.max(pixelWidth, 200), // Minimum 200px width
        height: Math.max(pixelHeight, 150), // Minimum 150px height
      });

      // Remove widget from grid after successful pop-out
      await removeWidget(widget.id);
    } catch (error) {
      console.error('Failed to pop out widget:', error);
      // Could show a toast notification here
    }
  };

  const handleAddWidget = useCallback((widgetType: string) => {
    void addWidget(widgetType);
  }, [addWidget]);

  // Register core widgets on mount (plugin system initialization)
  useEffect(() => {
    try {
      registerCoreWidgets();
    } catch (error) {
      console.error('[DraggableGrid] Failed to register core widgets:', error);
    }
  }, []);

  // Listen for add-widget events from the picker window
  useEffect(() => {
    const unlisten = listen<{ type: string }>('add-widget', (event) => {
      handleAddWidget(event.payload.type);
    });
    return () => {
      unlisten.then(f => f());
    };
  }, [handleAddWidget]);

  const openWidgetPicker = async () => {
    const label = 'widget-picker';
    const existing = await WebviewWindow.getByLabel(label);
    if (existing) {
      // Don't steal focus - just show the window
      // User can click it if they want to interact
      await existing.show();
      return;
    }

    const webview = new WebviewWindow(label, {
      url: '/#/widget-picker',
      title: 'Add Widget',
      width: 1270,
      height: 650,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      center: true,
      resizable: true,
      focus: true,
    });

    webview.once('tauri://created', function () {
      // webview window successfully created
    });
    
    webview.once('tauri://error', function (e) {
      // an error happened creating the webview window
      console.error(e);
    });
  };

  const openSettingsWindow = useCallback(async () => {
    const label = 'settings';
    const existing = await WebviewWindow.getByLabel(label);
    if (existing) {
      await existing.show();
      return;
    }

    const webview = new WebviewWindow(label, {
      url: '/#/settings',
      title: 'Settings',
      width: 1270,
      height: 650,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      center: true,
      resizable: true,
      focus: true,
    });

    webview.once('tauri://created', () => {});
    webview.once('tauri://error', (e) => {
      console.error('[DraggableGrid] Failed to open settings window:', e);
    });
  }, []);

  const gridStyle = useMemo(
    () => ({
      position: 'relative' as const,
      gridTemplateColumns: `repeat(${grid.columns}, 1fr)`,
      gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
      gap: `${GAP_SIZE}px`,
    }),
    [grid.columns, grid.rows],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && resizingWidgetId) {
        cancelResizeMode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cancelResizeMode, resizingWidgetId]);

  if (!isLoaded) {
    return (
      <div
        className={`draggable-grid ${debugGrid ? 'draggable-grid--debug' : ''} draggable-grid--loading`}
        ref={gridRef}
        style={gridStyle}
      >
        <GridCells grid={grid} highlight={null} debugGrid={debugGrid} isBlocked={false} isDragging={false} isResizing={false} />
      </div>
    );
  }

  return (
    <>
      <div
        className={`draggable-grid ${debugGrid ? 'draggable-grid--debug' : ''} ${isBlocked ? 'is-move-blocked' : ''}`}
        ref={gridRef}
        style={gridStyle}
        data-tauri-drag-region="false"
        onContextMenu={handleGridContextMenu}
        onPointerDown={(e) => {
          // Block window drag from grid background
          e.stopPropagation();
          
          if (!e.defaultPrevented) {
            cancelDrag();
            const clickedWidget = (e.target as HTMLElement).closest('.grid-widget');
            if (!clickedWidget && resizingWidgetId) {
              cancelResizeMode();
            }
          }
        }}
      >
        <GridCells grid={grid} highlight={previewArea} debugGrid={debugGrid} isBlocked={isBlocked} isDragging={!!dragInfo} isResizing={!!resizingWidgetId} />

        {widgets.map((widget) => {
          const WidgetComponent = widgetRegistry.get(widget.widgetType);
          if (!WidgetComponent) return null;
          let widgetToRender: WidgetLayout = widget;
          if (resizingWidgetId === widget.id && resizePreview) {
            widgetToRender = { ...widgetToRender, ...resizePreview };
          }
          return (
            <GridWidgetItem
              key={widget.id}
              widget={widgetToRender}
              WidgetComponent={WidgetComponent}
              handleWidgetPointerDown={handleWidgetPointerDownSafe}
              handleResizePointerDown={handleResizePointerDownSafe}
              handleContextMenu={handleContextMenu}
              onRemoveWidget={removeWidget}
              dragInfo={dragInfo}
              dragStyle={dragStyle}
              isResizing={resizingWidgetId === widget.id}
            />
          );
        })}

        <GridGhost ghostStyle={ghostStyle} dragInfo={dragInfo} widgets={widgets} widgetComponents={widgetRegistry.getComponents()} />
      </div>

      <GridContextMenu
        menu={contextMenu}
        onClose={handleCloseContextMenu}
        onAction={handleMenuAction}
        isAdjustGridMode={debugGrid}
        isFullscreen={settingsState?.isFullscreen ?? false}
      />
    </>
  );
}
