import { useCallback, useMemo, useRef, useState } from 'react';
import { useGridStore } from '../../store/gridStore';
import { useStore } from '../../store';
import GridGhost from './GridGhost';
import GridCells from './GridCells';
import useGridDrag from './useGridDrag';
import { useWidgetResize } from './useWidgetResize';
import './DraggableGrid.css';
import GridWidgetItem from './GridWidgetItem';
import GridContextMenu, { type ContextMenuState, type MenuAction } from '../ui/GridContextMenu';
import { WidgetSettingsPanel, AddWidgetPanel } from '../panels';
import type { WidgetLayout } from '../../types/layout';
import { clampToRange } from './gridMath';
import { ClockWidget, ChartWidget, MailWidget } from '../widgets';

const GAP_SIZE = 12;

const widgetComponents: Record<string, React.ComponentType> = {
  mail: MailWidget,
  clock: ClockWidget,
  chart: ChartWidget,
};

type PanelType = 'widget-settings' | 'add-widget' | null;

export function DraggableGrid() {
  const {
    widgets,
    grid,
    moveWidget,
    resizeWidget,
    removeWidget,
    addWidget,
    debugGrid,
    toggleDebugGrid,
    getConstraints,
  } = useGridStore();
  const { setFullscreen, toggleSettings } = useStore();

  const gridRef = useRef<HTMLDivElement | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [selectedWidget, setSelectedWidget] = useState<WidgetLayout | null>(null);

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
    setResizingWidgetId,
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

  const handleRemoveWidget = (id: string) => {
    void removeWidget(id);
  };

  const handleContextMenu = (e: React.MouseEvent, widget: WidgetLayout | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, widget });
  };

  const handleGridContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.grid-widget')) return;
    handleContextMenu(e, null);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleMenuAction = (action: MenuAction, widget?: WidgetLayout | null) => {
    switch (action) {
      case 'exit-fullscreen':
        setFullscreen(false);
        break;
      case 'settings':
        toggleSettings();
        break;
      case 'widget-settings':
        if (widget) {
          setSelectedWidget(widget);
          setActivePanel('widget-settings');
        }
        break;
      case 'resize':
        if (widget) {
          setResizingWidgetId(widget.id);
        }
        break;
      case 'toggle-adjust-grid':
        toggleDebugGrid();
        break;
      case 'remove-widget':
        if (widget) {
          void removeWidget(widget.id);
        }
        break;
      case 'add-widget':
        setActivePanel('add-widget');
        break;
    }
  };

  const handleAddWidget = (widgetType: string) => {
    void addWidget(widgetType);
  };

  const handleClosePanel = () => {
    setActivePanel(null);
    setSelectedWidget(null);
    setResizingWidgetId(null);
  };

  const availableWidgets = useMemo(
    () => [
      {
        id: 'mail',
        name: 'Mail',
        description: 'Unread messages and quick triage',
        isActive: widgets.some((widget) => widget.widgetType === 'mail'),
      },
      {
        id: 'clock',
        name: 'Clock',
        description: 'Analog + digital clock',
        isActive: widgets.some((widget) => widget.widgetType === 'clock'),
      },
      {
        id: 'chart',
        name: 'Chart',
        description: 'Compact sparkline + KPI',
        isActive: widgets.some((widget) => widget.widgetType === 'chart'),
      },
    ],
    [widgets],
  );

  const gridStyle = useMemo(
    () => ({
      position: 'relative' as const,
      gridTemplateColumns: `repeat(${grid.columns}, 1fr)`,
      gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
      gap: `${GAP_SIZE}px`,
    }),
    [grid.columns, grid.rows],
  );

  return (
    <>
      <div
        className={`draggable-grid ${debugGrid ? 'draggable-grid--debug' : ''} ${isBlocked ? 'is-move-blocked' : ''}`}
        ref={gridRef}
        style={gridStyle}
        onContextMenu={handleGridContextMenu}
        onPointerDown={(e) => {
          if (!e.defaultPrevented) {
            setResizingWidgetId(null);
            cancelDrag();
          }
        }}
      >
        <GridCells grid={grid} highlight={previewArea} debugGrid={debugGrid} isBlocked={isBlocked} />

        {widgets.map((widget) => {
          const WidgetComponent = widgetComponents[widget.widgetType];
          if (!WidgetComponent) return null;
          return (
            <GridWidgetItem
              key={widget.id}
              widget={widget}
              WidgetComponent={WidgetComponent}
              handleWidgetPointerDown={handleWidgetPointerDown}
              handleRemoveWidget={handleRemoveWidget}
              handleResizePointerDown={handleResizePointerDown}
              handleContextMenu={handleContextMenu}
              dragInfo={dragInfo}
              isResizing={resizingWidgetId === widget.id}
            />
          );
        })}

        <GridGhost ghostStyle={ghostStyle} dragInfo={dragInfo} widgets={widgets} widgetComponents={widgetComponents} />

        <button className="grid-overlay-toggle" onClick={toggleDebugGrid} title="Toggle grid overlay">
          {debugGrid ? 'Hide Grid' : 'Show Grid'}
        </button>
      </div>

      <GridContextMenu
        menu={contextMenu}
        onClose={handleCloseContextMenu}
        onAction={handleMenuAction}
        isAdjustGridMode={debugGrid}
      />

      {activePanel === 'widget-settings' && selectedWidget && <WidgetSettingsPanel widget={selectedWidget} onClose={handleClosePanel} />}
      {activePanel === 'add-widget' && (
        <AddWidgetPanel
          onClose={handleClosePanel}
          onAdd={handleAddWidget}
          widgets={availableWidgets}
        />
      )}
    </>
  );
}
