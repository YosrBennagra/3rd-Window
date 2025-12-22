import type { WidgetConfig } from '../types/widget';
import { ClockWidget } from '../components/widgets';

export const widgetRegistry: WidgetConfig[] = [
  {
    id: 'clock',
    name: 'Date & Time',
    description: 'Displays current time and date',
    icon: 'clock',
    component: ClockWidget,
    defaultSize: 'medium',
  },
];

export function getWidgetById(id: string): WidgetConfig | undefined {
  return widgetRegistry.find((widget) => widget.id === id);
}
