import type { WidgetConfig } from '../types/widget';
import { ChartWidget, ClockWidget, MailWidget } from '../components/widgets';

export const widgetRegistry: WidgetConfig[] = [
  {
    id: 'mail',
    name: 'Mail',
    description: 'Unread messages and triage tools',
    icon: '📨',
    component: MailWidget,
    defaultSize: 'large',
    minSize: { width: 3, height: 2 },
    maxSize: { width: 5, height: 4 },
  },
  {
    id: 'clock',
    name: 'Date & Time',
    description: 'Displays current time and date',
    icon: '🕐',
    component: ClockWidget,
    defaultSize: 'medium',
  },
  {
    id: 'chart',
    name: 'Chart',
    description: 'Mini KPI card with sparkline',
    icon: '📈',
    component: ChartWidget,
    defaultSize: 'medium',
    minSize: { width: 3, height: 2 },
    maxSize: { width: 5, height: 4 },
  },
];

export function getWidgetById(id: string): WidgetConfig | undefined {
  return widgetRegistry.find(widget => widget.id === id);
}
