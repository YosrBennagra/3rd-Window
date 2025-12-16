import type { WidgetConfig } from '../types/widget';
import { ClockWidget, CpuTempWidget, GpuTempWidget } from '../components/widgets';

export const widgetRegistry: WidgetConfig[] = [
  {
    id: 'clock',
    name: 'Date & Time',
    description: 'Displays current time and date',
    icon: '🕐',
    component: ClockWidget,
    defaultSize: 'medium',
  },
  {
    id: 'cpu-temp',
    name: 'CPU Temperature',
    description: 'Monitor CPU temperature in real-time',
    icon: '🖥️',
    component: CpuTempWidget,
    defaultSize: 'medium',
  },
  {
    id: 'gpu-temp',
    name: 'GPU Temperature',
    description: 'Monitor GPU temperature in real-time',
    icon: '🎮',
    component: GpuTempWidget,
    defaultSize: 'medium',
  },
];

export function getWidgetById(id: string): WidgetConfig | undefined {
  return widgetRegistry.find(widget => widget.id === id);
}
