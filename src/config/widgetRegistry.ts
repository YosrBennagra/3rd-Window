import type { WidgetConfig } from '../types/widget';
import { ChartWidget, ClockWidget, NotificationsWidget } from '../components/widgets';

export const widgetRegistry: WidgetConfig[] = [
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Unread alerts and mentions',
    icon: 'ĐY"ù',
    component: NotificationsWidget,
    defaultSize: 'large',
    minSize: { width: 3, height: 2 },
    maxSize: { width: 5, height: 4 },
  },
  {
    id: 'clock',
    name: 'Date & Time',
    description: 'Displays current time and date',
    icon: 'ĐY?',
    component: ClockWidget,
    defaultSize: 'medium',
  },
  {
    id: 'chart',
    name: 'Chart',
    description: 'Mini KPI card with sparkline',
    icon: 'ĐY"^',
    component: ChartWidget,
    defaultSize: 'medium',
    minSize: { width: 3, height: 2 },
    maxSize: { width: 5, height: 4 },
  },
];

export function getWidgetById(id: string): WidgetConfig | undefined {
  return widgetRegistry.find((widget) => widget.id === id);
}
