import { WidgetDefinition } from '../types/widgets';

export const widgetDefinitions: WidgetDefinition[] = [
  { id: 'notifications', title: 'Notifications', component: 'Notifications', defaultSize: { w: 3, h: 4 }, description: 'App, system, and connector notifications' },
  { id: 'temperature', title: 'CPU/GPU Temp', component: 'Temperature', defaultSize: { w: 3, h: 2 } },
  { id: 'ram', title: 'RAM Usage', component: 'RamUsage', defaultSize: { w: 3, h: 2 } },
  { id: 'disk', title: 'Disk Usage', component: 'DiskUsage', defaultSize: { w: 3, h: 2 } },
  { id: 'network', title: 'Network Speed', component: 'NetworkSpeed', defaultSize: { w: 3, h: 2 } },
  { id: 'clock', title: 'Clock/Calendar', component: 'ClockCalendar', defaultSize: { w: 2, h: 2 } },
  { id: 'notes', title: 'Notes', component: 'Notes', defaultSize: { w: 3, h: 2 } },
  { id: 'alerts', title: 'Alerts', component: 'Alerts', defaultSize: { w: 3, h: 3 }, description: 'Threshold-based signal for critical events' },
  { id: 'shortcuts', title: 'Shortcuts & Games', component: 'Shortcuts', defaultSize: { w: 3, h: 2 } },
  { id: 'integrations', title: 'Integrations', component: 'Integrations', defaultSize: { w: 3, h: 3 }, description: 'Discord, Slack, WhatsApp, Facebook, Messenger' },
  { id: 'pipelines', title: 'Pipelines', component: 'Pipelines', defaultSize: { w: 3, h: 3 }, description: 'n8n and automation health' },
  { id: 'power', title: 'Power Saving', component: 'PowerMode', defaultSize: { w: 3, h: 1 }, description: 'Ambient mode controls' }
];
