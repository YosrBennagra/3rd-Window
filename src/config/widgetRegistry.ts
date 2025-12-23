import type { WidgetConfig } from '../domain/models/widget';
import { ClockWidget, ImageWidget } from '../ui/components/widgets';

export const widgetRegistry: WidgetConfig[] = [
  {
    id: 'clock',
    name: 'Date & Time',
    description: 'Displays current time and date',
    icon: 'clock',
    component: ClockWidget,
    defaultSize: 'medium',
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Display a custom image or photo',
    icon: '???',
    component: ImageWidget,
    defaultSize: 'medium',
  },
];

export function getWidgetById(id: string): WidgetConfig | undefined {
  return widgetRegistry.find((widget) => widget.id === id);
}
