import type { WidgetGridItem } from '../../store/gridStore';

interface Props {
  widget: WidgetGridItem;
  WidgetComponent: React.ComponentType<any>;
  handleWidgetPointerDown: (e: React.PointerEvent, widget: WidgetGridItem) => void;
  handleRemoveWidget: (id: string) => void;
  handleResizePointerDown: (e: React.PointerEvent, widget: WidgetGridItem) => void;
  handleContextMenu: (e: React.MouseEvent, widget: WidgetGridItem) => void;
  dragInfo?: any;
}

export default function GridWidgetItem({ widget, WidgetComponent, handleWidgetPointerDown, handleRemoveWidget, handleResizePointerDown, handleContextMenu, dragInfo }: Props) {
  return (
    <div
      key={widget.id}
      className={`grid-widget ${dragInfo?.id === widget.id ? 'grid-widget--dragging' : ''}`}
      onPointerDown={(e) => handleWidgetPointerDown(e, widget)}
      onContextMenu={(e) => handleContextMenu(e, widget)}
      style={{
        gridColumn: `${widget.position.col + 1} / span ${widget.position.width}`,
        gridRow: `${widget.position.row + 1} / span ${widget.position.height}`,
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
      <div
        className="grid-widget__resize-handle"
        onPointerDown={(e) => handleResizePointerDown(e, widget)}
        title="Drag to resize"
      />
    </div>
  );
}
