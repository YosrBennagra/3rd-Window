import { memo } from 'react';
import type { WidgetLayout } from '../../types/layout';
import type { ResizeHandle } from './useWidgetResize';

interface Props {
  widget: WidgetLayout;
  WidgetComponent: React.ComponentType<any>;
  handleWidgetPointerDown: (e: React.PointerEvent, widget: WidgetLayout) => void;
  handleResizePointerDown: (e: React.PointerEvent, widget: WidgetLayout, handle: ResizeHandle) => void;
  handleContextMenu: (e: React.MouseEvent, widget: WidgetLayout) => void;
  dragInfo?: { id: string } | null;
  isResizing?: boolean;
}

function GridWidgetItem({
  widget,
  WidgetComponent,
  handleWidgetPointerDown,
  handleResizePointerDown,
  handleContextMenu,
  dragInfo,
  isResizing,
}: Props) {
  return (
    <div
      key={widget.id}
      className={`grid-widget ${dragInfo?.id === widget.id ? 'grid-widget--dragging' : ''} ${isResizing ? 'grid-widget--resizing' : ''}`}
      onPointerDown={(e) => {
        e.stopPropagation();
        handleWidgetPointerDown(e, widget);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        handleContextMenu(e, widget);
      }}
      data-tauri-drag-region="false"
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.width}`,
        gridRow: `${widget.y + 1} / span ${widget.height}`,
      }}
    >
      <div className="grid-widget__content">
        <WidgetComponent widget={widget} />
      </div>
      {isResizing && (
        <>
          {[
            { handle: 'nw', className: 'grid-widget__resize-handle grid-widget__resize-handle--tl' },
            { handle: 'ne', className: 'grid-widget__resize-handle grid-widget__resize-handle--tr' },
            { handle: 'sw', className: 'grid-widget__resize-handle grid-widget__resize-handle--bl' },
            { handle: 'se', className: 'grid-widget__resize-handle grid-widget__resize-handle--br' },
          ].map(({ handle, className }) => (
            <div
              key={handle}
              className={className}
              onPointerDown={(e) => {
                e.stopPropagation();
                handleResizePointerDown(e, widget, handle as ResizeHandle);
              }}
              title="Resize"
            />
          ))}
          {(['n', 's', 'e', 'w'] as ResizeHandle[]).map((handle) => (
            <div
              key={handle}
              className={`grid-widget__resize-edge grid-widget__resize-edge--${handle}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                handleResizePointerDown(e, widget, handle);
              }}
              title="Resize"
            />
          ))}
        </>
      )}
    </div>
  );
}

export default memo(GridWidgetItem);
