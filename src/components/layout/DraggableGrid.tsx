import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { listen } from '@tauri-apps/api/event';
import { useGridStore } from '../../store/gridStore';
import { useStore } from '../../store';
import GridGhost from './GridGhost';
import GridCells from './GridCells';
import useGridDrag from './useGridDrag';
import { useWidgetResize } from './useWidgetResize';
import type { ResizeHandle } from './useWidgetResize';
import './DraggableGrid.css';
import GridWidgetItem from './GridWidgetItem';
import GridContextMenu, { type ContextMenuState, type MenuAction } from '../ui/GridContextMenu';
import { WidgetSettingsPanel } from '../panels';
import type { WidgetLayout } from '../../types/layout';
import { clampToRange } from './gridMath';
import { ClockWidget, TimerWidget, ActivityWidget, ImageWidget, VideoWidget, NotesWidget, QuickLinksWidget, NetworkMonitorWidget, TemperatureWidget, RamUsageWidget, DiskUsageWidget, PDFWidget } from '../widgets';
import type { ClockWidgetSettings, TimerWidgetSettings } from '../../types/widgets';

const GAP_SIZE = 12;

const widgetComponents: Record<string, React.ComponentType<{ widget: WidgetLayout }>> = {
  clock: ClockWidget,
  timer: TimerWidget,
  activity: ActivityWidget,
  image: ImageWidget,
  video: VideoWidget,
  notes: NotesWidget,
  quicklinks: QuickLinksWidget,
  'network-monitor': NetworkMonitorWidget,
  temperature: TemperatureWidget,
  ram: RamUsageWidget,
  disk: DiskUsageWidget,
  pdf: PDFWidget,
};

type PanelType = 'widget-settings' | 'add-widget' | null;

export function DraggableGrid() {
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
    updateWidgetSettings,
  } = useGridStore();
  const setFullscreen = useStore((state) => state.setFullscreen);
  const toggleSettings = useStore((state) => state.toggleSettings);
  const settingsState = useStore((state) => state.settings);

  const gridRef = useRef<HTMLDivElement | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [widgetPreviewSettings, setWidgetPreviewSettings] = useState<Record<string, ClockWidgetSettings | TimerWidgetSettings>>({});
  const selectedWidget = useMemo(
    () => (selectedWidgetId ? widgets.find((widget) => widget.id === selectedWidgetId) ?? null : null),
    [selectedWidgetId, widgets],
  );

  const handlePreviewSettingsChange = useCallback((widgetId: string, settings: ClockWidgetSettings | TimerWidgetSettings) => {
    setWidgetPreviewSettings((prev) => ({
      ...prev,
      [widgetId]: settings,
    }));
  }, []);

  const clearPreviewSettings = useCallback((widgetId: string | null) => {
    if (!widgetId) return;
    setWidgetPreviewSettings((prev) => {
      if (!prev[widgetId]) return prev;
      const next = { ...prev };
      delete next[widgetId];
      return next;
    });
  }, []);

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

  const closeSettingsPanel = useCallback(() => {
    setActivePanel(null);
    setSelectedWidgetId(null);
    cancelResizeMode();
  }, [cancelResizeMode]);

  const handlePanelCancel = useCallback(() => {
    clearPreviewSettings(selectedWidgetId);
    closeSettingsPanel();
  }, [clearPreviewSettings, closeSettingsPanel, selectedWidgetId]);

  const handlePanelApply = useCallback(
    async (settings: ClockWidgetSettings | TimerWidgetSettings) => {
      if (!selectedWidgetId) return;
      const success = await updateWidgetSettings(selectedWidgetId, settings as unknown as Record<string, unknown>);
      if (success) {
        clearPreviewSettings(selectedWidgetId);
        closeSettingsPanel();
      }
    },
    [selectedWidgetId, updateWidgetSettings, clearPreviewSettings, closeSettingsPanel],
  );

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
    switch (action) {
      case 'exit-fullscreen':
        void setFullscreen(settingsState?.isFullscreen ? false : true);
        break;
      case 'settings':
        toggleSettings();
        break;
      case 'widget-settings':
        if (widget) {
          setSelectedWidgetId(widget.id);
          setActivePanel('widget-settings');
        }
        break;
      case 'resize':
        if (widget && !widget.locked) {
          beginResize(widget);
        }
        break;
      case 'toggle-adjust-grid':
        toggleDebugGrid();
        break;
      case 'remove-widget':
        if (widget) {
          if (widget.id === selectedWidgetId) {
            setSelectedWidgetId(null);
            setActivePanel(null);
          }
          void removeWidget(widget.id);
        }
        break;
      case 'add-widget':
        void openWidgetPicker();
        break;
      case 'toggle-lock':
        if (widget) {
          if (resizingWidgetId === widget.id) {
            cancelResizeMode();
          }
          void setWidgetLock(widget.id, !(widget.locked ?? false));
        }
        break;
    }
  };

  const handleAddWidget = useCallback((widgetType: string) => {
    void addWidget(widgetType);
  }, [addWidget]);

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
      await existing.setFocus();
      return;
    }

    const webview = new WebviewWindow(label, {
      url: '/#/widget-picker',
      title: 'Add Widget',
      width: 520,
      height: 400,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      center: true,
      resizable: false
    });

    webview.once('tauri://created', function () {
      // webview window successfully created
    });
    
    webview.once('tauri://error', function (e) {
      // an error happened creating the webview window
      console.error(e);
    });
  };

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

  useEffect(() => {
    if (activePanel === 'widget-settings' && selectedWidgetId && !selectedWidget) {
      setActivePanel(null);
      setSelectedWidgetId(null);
    }
  }, [activePanel, selectedWidget, selectedWidgetId]);

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
          const WidgetComponent = widgetComponents[widget.widgetType];
          if (!WidgetComponent) return null;
          const previewSettings = widgetPreviewSettings[widget.id];
          let widgetToRender: WidgetLayout = previewSettings
            ? { ...widget, settings: previewSettings as unknown as Record<string, unknown> }
            : widget;
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
              dragInfo={dragInfo}
              isResizing={resizingWidgetId === widget.id}
            />
          );
        })}

        <GridGhost ghostStyle={ghostStyle} dragInfo={dragInfo} widgets={widgets} widgetComponents={widgetComponents} />
      </div>

      <GridContextMenu
        menu={contextMenu}
        onClose={handleCloseContextMenu}
        onAction={handleMenuAction}
        isAdjustGridMode={debugGrid}
        isFullscreen={settingsState?.isFullscreen ?? false}
      />

      {activePanel === 'widget-settings' && selectedWidget && (
        <WidgetSettingsPanel
          widget={selectedWidget}
          previewSettings={widgetPreviewSettings[selectedWidget.id]}
          onPreviewChange={(settings) => handlePreviewSettingsChange(selectedWidget.id, settings)}
          onApply={handlePanelApply}
          onCancel={handlePanelCancel}
        />
      )}
    </>
  );
}
