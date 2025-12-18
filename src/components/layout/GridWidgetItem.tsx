import type { WidgetLayout } from '../../types/layout';

interface Props {
  widget: WidgetLayout;
  WidgetComponent: React.ComponentType<any>;
  handleWidgetPointerDown: (e: React.PointerEvent, widget: WidgetLayout) => void;
  handleResizePointerDown: (e: React.PointerEvent, widget: WidgetLayout) => void;
  handleContextMenu: (e: React.MouseEvent, widget: WidgetLayout) => void;
  dragInfo?: { id: string } | null;
  isResizing?: boolean;
  onResizeConfirm?: () => void;
  onResizeCancel?: () => void;
  canConfirmResize?: boolean;
}

export default function GridWidgetItem({
  widget,
  WidgetComponent,
  handleWidgetPointerDown,
  handleResizePointerDown,
  handleContextMenu,
  dragInfo,
  isResizing,
  onResizeConfirm,
  onResizeCancel,
  canConfirmResize,
}: Props) {
  const isLocked = widget.locked ?? false;

  return (
    <div
      key={widget.id}
      className={`grid-widget ${dragInfo?.id === widget.id ? 'grid-widget--dragging' : ''} ${isResizing ? 'grid-widget--resizing' : ''} ${isLocked ? 'grid-widget--locked' : ''}`}
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

      {isLocked && (
        <span className="grid-widget__lock-indicator" title="Widget locked">
          🔒
        </span>
      )}

      {isResizing && (
        <>
          <div
            className="grid-widget__resize-handle grid-widget__resize-handle--br"
            onPointerDown={(e) => handleResizePointerDown(e, widget)}
            title="Drag to resize"
          />
          <div className="grid-widget__resize-controls">
            <button
              className="grid-widget__resize-control grid-widget__resize-control--confirm"
              onClick={(e) => {
                e.stopPropagation();
                if (canConfirmResize) {
                  onResizeConfirm?.();
                }
              }}
              disabled={!canConfirmResize}
              title="Confirm resize"
            >
              ✓
            </button>
            <button
              className="grid-widget__resize-control grid-widget__resize-control--cancel"
              onClick={(e) => {
                e.stopPropagation();
                onResizeCancel?.();
              }}
              title="Cancel resize"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}
