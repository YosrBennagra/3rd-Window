import React from 'react';
import type { WidgetGridItem } from '../../store/gridStore';

type DragInfo = { id: string; width: number; height: number };

type Props = {
  ghostStyle: React.CSSProperties | null;
  dragInfo: DragInfo | null;
  swapCandidateId: string | null;
  widgets: WidgetGridItem[];
  widgetComponents: Record<string, React.ComponentType>;
};

export default function GridGhost({ ghostStyle, dragInfo, swapCandidateId, widgets, widgetComponents }: Props) {
  if (!ghostStyle || !dragInfo) return null;

  const movingWidget = widgets.find(w => w.id === dragInfo.id);
  const Comp = movingWidget ? widgetComponents[movingWidget.widgetType] : null;

  return (
    <div className={`grid-widget grid-widget--ghost ${swapCandidateId ? 'swap' : ''}`} style={ghostStyle}>
      {movingWidget && (
        <div className="grid-widget__content" aria-hidden="true">
          {Comp ? <Comp /> : null}
        </div>
      )}
    </div>
  );
}
