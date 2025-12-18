import React from 'react';
import type { WidgetLayout } from '../../types/layout';

type DragInfo = { id: string; width: number; height: number; widgetType: string };

type Props = {
  ghostStyle: React.CSSProperties | null;
  dragInfo: DragInfo | null;
  widgets: WidgetLayout[];
  widgetComponents: Record<string, React.ComponentType>;
};

export default function GridGhost({ ghostStyle, dragInfo, widgets, widgetComponents }: Props) {
  if (!ghostStyle || !dragInfo) return null;

  const movingWidget = widgets.find((w) => w.id === dragInfo.id);
  const Comp = movingWidget ? widgetComponents[movingWidget.widgetType] : null;

  return (
    <div className="grid-widget grid-widget--ghost" style={ghostStyle}>
      {movingWidget && (
        <div className="grid-widget__content" aria-hidden="true">
          {Comp ? <Comp widget={movingWidget} /> : null}
        </div>
      )}
    </div>
  );
}
