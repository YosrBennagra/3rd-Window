import React from 'react';
import WidgetFrame from './WidgetFrame';
import { widgetDefinitions } from '../config/widgets';

export default function WidgetHost() {
  return (
    <div className="widget-host">
      {widgetDefinitions.map((w) => (
        <WidgetFrame key={w.id} title={w.title}>
          <div className="widget-placeholder">{w.title} widget</div>
        </WidgetFrame>
      ))}
    </div>
  );
}
