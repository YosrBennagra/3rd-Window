import type { WidgetConfig } from '../types/widget';
import { ClockWidget, NotificationsWidget } from '../components/widgets';

export const widgetRegistry: WidgetConfig[] = [
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Unread alerts and mentions',
    icon: 'bell',
    component: NotificationsWidget,
    defaultSize: 'large',
    minSize: { width: 3, height: 2 },
    maxSize: { width: 5, height: 4 },
  },
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
