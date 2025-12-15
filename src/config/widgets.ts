import { WidgetDefinition } from '../types/widgets';

export const widgetDefinitions: WidgetDefinition[] = [
  { id: 'notifications', title: 'Notifications', component: 'Notifications', defaultSize: { w: 3, h: 4 } },
  { id: 'temperature', title: 'CPU/GPU Temp', component: 'Temperature', defaultSize: { w: 3, h: 3 } },
  { id: 'ram', title: 'RAM Usage', component: 'RamUsage', defaultSize: { w: 3, h: 2 } },
  { id: 'disk', title: 'Disk Usage', component: 'DiskUsage', defaultSize: { w: 3, h: 2 } },
  { id: 'network', title: 'Network Speed', component: 'NetworkSpeed', defaultSize: { w: 3, h: 2 } },
  { id: 'clock', title: 'Clock/Calendar', component: 'ClockCalendar', defaultSize: { w: 2, h: 2 } },
  { id: 'notes', title: 'Notes', component: 'Notes', defaultSize: { w: 3, h: 3 } },
  { id: 'alerts', title: 'Alerts', component: 'Alerts', defaultSize: { w: 3, h: 3 } }
];
