import type { WidgetGridItem } from '../../store/gridStore';

interface Props {
  widget: WidgetGridItem;
  WidgetComponent: React.ComponentType<any>;
  handleWidgetPointerDown: (e: React.PointerEvent, widget: WidgetGridItem) => void;
  handleRemoveWidget: (id: string) => void;
  handleResizePointerDown: (e: React.PointerEvent, widget: WidgetGridItem) => void;
  handleContextMenu: (e: React.MouseEvent, widget: WidgetGridItem) => void;
  dragInfo?: any;
  isResizing?: boolean;
}

export default function GridWidgetItem({ widget, WidgetComponent, handleWidgetPointerDown, handleRemoveWidget, handleResizePointerDown, handleContextMenu, dragInfo, isResizing }: Props) {
  return (
    <div
      key={widget.id}
      className={`grid-widget ${dragInfo?.id === widget.id ? 'grid-widget--dragging' : ''} ${isResizing ? 'grid-widget--resizing' : ''}`}
      onPointerDown={(e) => handleWidgetPointerDown(e, widget)}
      onContextMenu={(e) => handleContextMenu(e, widget)}
      style={{
        gridColumn: `${widget.position.col * 2 + 1} / span ${widget.position.width * 2 - 1}`,
        gridRow: `${widget.position.row * 2 + 1} / span ${widget.position.height * 2 - 1}`,
      }}
    >
      <div className="grid-widget__content">
        <WidgetComponent />
      </div>
      <button
        className="grid-widget__remove"
        onClick={() => handleRemoveWidget(widget.id)}
        title="Remove widget"
      >
        ✕
      </button>
      
      {isResizing && (
        <>
          <div className="grid-widget__resize-handle grid-widget__resize-handle--tl" />
          <div className="grid-widget__resize-handle grid-widget__resize-handle--tr" />
          <div className="grid-widget__resize-handle grid-widget__resize-handle--bl" />
          <div
            className="grid-widget__resize-handle grid-widget__resize-handle--br"
            onPointerDown={(e) => handleResizePointerDown(e, widget)}
            title="Drag to resize"
          />
        </>
      )}
    </div>
  );
}
