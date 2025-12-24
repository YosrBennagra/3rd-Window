import { memo } from 'react';
import type { WidgetLayout } from '../../../domain/models/layout';
import type { ResizeHandle } from './useWidgetResize';
import { WidgetErrorBoundary } from '../widgets/WidgetErrorBoundary';

interface Props {
  widget: WidgetLayout;
  WidgetComponent: React.ComponentType<any>; // Union type makes this complex, keep as any for now
  handleWidgetPointerDown: (e: React.PointerEvent, widget: WidgetLayout) => void;
  handleResizePointerDown: (e: React.PointerEvent, widget: WidgetLayout, handle: ResizeHandle) => void;
  handleContextMenu: (e: React.MouseEvent, widget: WidgetLayout) => void;
  onRemoveWidget?: (widgetId: string) => void;
  dragInfo?: { id: string } | null;
  isResizing?: boolean;
}

function GridWidgetItem({
  widget,
  WidgetComponent,
  handleWidgetPointerDown,
  handleResizePointerDown,
  handleContextMenu,
  onRemoveWidget,
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
        <WidgetErrorBoundary
          widget={widget}
          onRemove={() => onRemoveWidget?.(widget.id)}
        >
          <WidgetComponent widget={widget} />
        </WidgetErrorBoundary>
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
