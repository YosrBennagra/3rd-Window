import { WidgetDefinition } from '../types/widgets';

export const widgetDefinitions: WidgetDefinition[] = [
  { id: 'notifications', title: 'Notifications', component: 'Notifications', defaultSize: { w: 3, h: 4 }, description: 'App, system, and connector notifications' },
  { id: 'temperature', title: 'CPU/GPU Temp', component: 'TemperatureWidget', defaultSize: { w: 3, h: 4 }, description: 'Monitor CPU and GPU temperatures' },
  { id: 'ram', title: 'RAM Usage', component: 'RamUsageWidget', defaultSize: { w: 3, h: 4 }, description: 'Memory usage statistics' },
  { id: 'disk', title: 'Disk Usage', component: 'DiskUsageWidget', defaultSize: { w: 3, h: 4 }, description: 'Storage space monitoring' },
  { id: 'network-monitor', title: 'Network Monitor', component: 'NetworkMonitorWidget', defaultSize: { w: 4, h: 5 }, description: 'Real-time network speed and data transfer statistics' },
  { id: 'clock', title: 'Clock/Calendar', component: 'ClockCalendar', defaultSize: { w: 2, h: 2 } },
  { id: 'notes', title: 'Notes', component: 'NotesWidget', defaultSize: { w: 4, h: 4 }, description: 'Quick notes and todo lists' },
  { id: 'quicklinks', title: 'Quick Links', component: 'QuickLinksWidget', defaultSize: { w: 4, h: 4 }, description: 'Bookmarks and shortcuts' },
  { id: 'image', title: 'Picture', component: 'ImageWidget', defaultSize: { w: 3, h: 3 }, description: 'Display your favorite images' },
  { id: 'video', title: 'Video', component: 'VideoWidget', defaultSize: { w: 3, h: 3 }, description: 'Play your favorite videos' },
  { id: 'pdf', title: 'PDF Viewer', component: 'PDFWidget', defaultSize: { w: 6, h: 6 }, description: 'View PDF documents with zoom controls' },
  { id: 'alerts', title: 'Alerts', component: 'Alerts', defaultSize: { w: 3, h: 3 }, description: 'Threshold-based signal for critical events' },
  { id: 'activity', title: 'Activity Monitor', component: 'ActivityWidget', defaultSize: { w: 6, h: 4 }, description: 'System uptime and active window tracking' },
  { id: 'integrations', title: 'Integrations', component: 'Integrations', defaultSize: { w: 3, h: 3 }, description: 'Coming Soon: Discord, Slack, WhatsApp, Facebook, Messenger', disabled: true },
  { id: 'pipelines', title: 'Pipelines', component: 'Pipelines', defaultSize: { w: 3, h: 3 }, description: 'Coming Soon: n8n and automation health', disabled: true },
  { id: 'shortcuts', title: 'Shortcuts & Games', component: 'Shortcuts', defaultSize: { w: 3, h: 2 }, description: 'Use Quick Links widget instead', disabled: true },
  { id: 'power', title: 'Power Saving', component: 'PowerMode', defaultSize: { w: 3, h: 1 }, description: 'Coming Soon: Ambient mode controls', disabled: true }
];
