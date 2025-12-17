import { useMemo, useRef, useState } from 'react';
import { useGridStore, type WidgetGridItem, GRID_COLS, GRID_ROWS } from '../../store/gridStore';
import { useStore } from '../../store';
import GridResizers from './GridResizers';
import GridGhost from './GridGhost';
import useGridDrag from './useGridDrag';
import { ClockWidget } from '../widgets';
import GridCells from './GridCells';
import GridWidgetItem from './GridWidgetItem';
import GridContextMenu, { type ContextMenuState, type MenuAction } from '../ui/GridContextMenu';
import { SettingsPanel, WidgetSettingsPanel, AddWidgetPanel } from '../panels';
import { useGridTracks } from './useGridTracks';
import { useWidgetResize } from './useWidgetResize';
import './DraggableGrid.css';

const GAP_SIZE = 12;

const widgetComponents: Record<string, React.ComponentType> = {
  'clock': ClockWidget,
};

type PanelType = 'settings' | 'widget-settings' | 'add-widget' | null;

export function DraggableGrid() {
  const { widgets, gridLayout, updateWidgetPositionWithPush, updateWidgetPosition, removeWidget, setGridLayout, addWidget, isPositionOccupied } = useGridStore();
  const { setFullscreen } = useStore();
  const gridRef = useRef<HTMLDivElement | null>(null);

  const {
    colWidths,
    rowHeights,
    setColWidths,
    setRowHeights,
    getGridMetrics,
    getCellFromPointer,
    gridStyle,
  } = useGridTracks({
    gridRef,
    gridLayout,
    gapSize: GAP_SIZE,
    onPersist: setGridLayout,
  });

  // Context menu and panel state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [selectedWidget, setSelectedWidget] = useState<WidgetGridItem | null>(null);
  
  const [isAdjustGridMode, setIsAdjustGridMode] = useState(false);
  const [isGridResizing, setIsGridResizing] = useState(false);
  const {
    dragInfo,
    ghostStyle,
    handleWidgetPointerDown: originalHandleWidgetPointerDown,
  } = useGridDrag({
    gridRef,
    widgets,
    updateWidgetPositionWithPush,
    updateWidgetPosition,
    getGridMetrics,
    getCellFromPointer,
  });

  const isOutOfBounds = (position: { col: number; row: number; width: number; height: number }) => {
    if (position.col < 0 || position.row < 0) return true;
    if (position.width < 1 || position.height < 1) return true;
    if (position.col + position.width > GRID_COLS) return true;
    if (position.row + position.height > GRID_ROWS) return true;
    return false;
  };

  const handleRemoveWidget = (id: string) => {
    removeWidget(id);
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, widget: WidgetGridItem | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, widget });
  };

  const handleGridContextMenu = (e: React.MouseEvent) => {
    // Only show if clicking on empty grid area (not on a widget)
    if ((e.target as HTMLElement).closest('.grid-widget')) return;
    handleContextMenu(e, null);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleMenuAction = (action: MenuAction, widget?: WidgetGridItem | null) => {
    switch (action) {
      case 'exit-fullscreen':
        setFullscreen(false);
        break;
      case 'settings':
        setActivePanel('settings');
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
        setIsAdjustGridMode(!isAdjustGridMode);
        break;
      case 'remove-widget':
        if (widget) {
          removeWidget(widget.id);
        }
        break;
      case 'add-widget':
        setActivePanel('add-widget');
        break;
    }
  };

  const handleClosePanel = () => {
    setActivePanel(null);
    setSelectedWidget(null);
  };

  const availableWidgets = useMemo(
    () => [
      {
        id: 'clock',
        name: 'Clock',
        description: 'Analog + digital clock',
        isActive: widgets.some((widget) => widget.widgetType === 'clock'),
      },
    ],
    [widgets],
  );

  const addWidgetToFirstFreeSpot = (widgetType: string) => {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const position = { col, row, width: 1, height: 1 };
        if (!isPositionOccupied(position)) {
          addWidget(widgetType, position);
          return true;
        }
      }
    }
    return false;
  };

  const handleAddWidget = (widgetType: string) => {
    const added = addWidgetToFirstFreeSpot(widgetType);
    if (!added) {
      console.warn('[grid] No space available to add widget', widgetType);
    }
  };

  const { resizingWidgetId, setResizingWidgetId, handleResizePointerDown } = useWidgetResize({
    gridRef,
    widgets,
    getGridMetrics,
    updateWidgetPositionWithPush,
    dragInfo,
  });

  const handleWidgetPointerDownWrapped = (e: React.PointerEvent, widget: WidgetGridItem) => {
    if (resizingWidgetId && resizingWidgetId !== widget.id) {
      setResizingWidgetId(null);
    }
    originalHandleWidgetPointerDown(e, widget);
  };
  

  return (
    <>
      <div 
        className={`draggable-grid ${isAdjustGridMode ? 'draggable-grid--adjust' : ''} ${isGridResizing ? 'is-resizing-grid' : ''}`}
        ref={gridRef}
        style={gridStyle}
        onContextMenu={handleGridContextMenu}
        onPointerDown={(e) => {
          if (!e.defaultPrevented) {
            setResizingWidgetId(null);
          }
        }}
      >
        <GridCells hoverCell={null} dragInfo={null} isDragBlocked={false} isOutOfBounds={isOutOfBounds} />
        {isAdjustGridMode && (
          <GridResizers 
            gridRef={gridRef} 
            colWidths={colWidths} 
            rowHeights={rowHeights} 
            setColWidths={setColWidths} 
            setRowHeights={setRowHeights}
            onResizeStart={() => setIsGridResizing(true)}
            onResizeEnd={() => setIsGridResizing(false)}
          />
        )}
        
        {widgets.map((widget) => {
          const WidgetComponent = widgetComponents[widget.widgetType];
          if (!WidgetComponent) return null;
          return (
            <GridWidgetItem
              key={widget.id}
              widget={widget}
              WidgetComponent={WidgetComponent}
              handleWidgetPointerDown={handleWidgetPointerDownWrapped}
              handleRemoveWidget={handleRemoveWidget}
              handleResizePointerDown={handleResizePointerDown}
              handleContextMenu={handleContextMenu}
              dragInfo={dragInfo}
              isResizing={resizingWidgetId === widget.id}
            />
          );
        })}
        <GridGhost ghostStyle={ghostStyle} dragInfo={dragInfo} widgets={widgets} widgetComponents={widgetComponents} />
      </div>

      {/* Context Menu */}
      <GridContextMenu
        menu={contextMenu}
        onClose={handleCloseContextMenu}
        onAction={handleMenuAction}
        isAdjustGridMode={isAdjustGridMode}
      />

      {/* Panels */}
      {activePanel === 'settings' && (
        <SettingsPanel onClose={handleClosePanel} />
      )}
      {activePanel === 'widget-settings' && selectedWidget && (
        <WidgetSettingsPanel widget={selectedWidget} onClose={handleClosePanel} />
      )}
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
