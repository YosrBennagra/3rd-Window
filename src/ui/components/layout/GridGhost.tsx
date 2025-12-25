import React, { memo } from 'react';
import type { WidgetLayout } from '../../../domain/models/layout';
import type { WidgetComponent } from '../../../config/widgetRegistry';

type DragInfo = { id: string; width: number; height: number; widgetType: string };

type Props = {
  ghostStyle: React.CSSProperties | null;
  dragInfo: DragInfo | null;
  widgets: WidgetLayout[];
  widgetComponents: Record<string, WidgetComponent>;
};

// Memoized to prevent re-renders during drag
const GhostWidget = memo<{ widget: WidgetLayout; Comp: WidgetComponent }>(({ widget, Comp }) => (
  <div className="grid-widget__content" aria-hidden="true">
    {/* @ts-expect-error: Union type compatibility - widget components use legacy API */}
    <Comp widget={widget} />
  </div>
));

GhostWidget.displayName = 'GhostWidget';

/**
 * Ghost follows cursor freely - looks like the actual widget being dragged
 */
export default function GridGhost({ ghostStyle, dragInfo, widgets, widgetComponents }: Props) {
  if (!ghostStyle || !dragInfo) return null;

  const movingWidget = widgets.find((w) => w.id === dragInfo.id);
  const Comp = movingWidget ? widgetComponents[movingWidget.widgetType] : null;

  if (!movingWidget || !Comp) return null;

  return (
    <div className="grid-widget grid-widget--ghost" style={ghostStyle}>
      <GhostWidget widget={movingWidget} Comp={Comp} />
    </div>
  );
}
