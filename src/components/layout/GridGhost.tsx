import React from 'react';
import type { WidgetGridItem } from '../../store/gridStore';

type DragInfo = { id: string; width: number; height: number };

type Props = {
  ghostStyle: React.CSSProperties | null;
  dragInfo: DragInfo | null;
  widgets: WidgetGridItem[];
  widgetComponents: Record<string, React.ComponentType>;
};

export default function GridGhost({ ghostStyle, dragInfo, widgets, widgetComponents }: Props) {
  if (!ghostStyle || !dragInfo) return null;

  const movingWidget = widgets.find(w => w.id === dragInfo.id);
  const Comp = movingWidget ? widgetComponents[movingWidget.widgetType] : null;

  return (
    <div 
      className="grid-widget grid-widget--ghost" 
      style={{
        ...ghostStyle,
        // Override grid placement if ghostStyle uses pixels, but if it uses gridColumn/Row we need to adjust
        gridColumn: movingWidget ? `${movingWidget.position.col * 2 + 1} / span ${movingWidget.position.width * 2 - 1}` : undefined,
        gridRow: movingWidget ? `${movingWidget.position.row * 2 + 1} / span ${movingWidget.position.height * 2 - 1}` : undefined,
        // If ghostStyle has transform/width/height in pixels, those take precedence for dragging visual
      }}
    >
      {movingWidget && (
        <div className="grid-widget__content" aria-hidden="true">
          {Comp ? <Comp /> : null}
        </div>
      )}
    </div>
  );
}
