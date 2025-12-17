import type { WidgetLayout } from '../../types/layout';

interface Props {
  widget: WidgetLayout;
  WidgetComponent: React.ComponentType<any>;
  handleWidgetPointerDown: (e: React.PointerEvent, widget: WidgetLayout) => void;
  handleRemoveWidget: (id: string) => void;
  handleResizePointerDown: (e: React.PointerEvent, widget: WidgetLayout) => void;
  handleContextMenu: (e: React.MouseEvent, widget: WidgetLayout) => void;
  dragInfo?: { id: string } | null;
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
        gridColumn: `${widget.x + 1} / span ${widget.width}`,
        gridRow: `${widget.y + 1} / span ${widget.height}`,
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
          <div className="grid-widget__resize-handle grid-widget__resize-handle--br" onPointerDown={(e) => handleResizePointerDown(e, widget)} title="Drag to resize" />
        </>
      )}
    </div>
  );
}
