import { NotificationItem } from '../types/widgets';

const sources = ['System', 'Discord', 'Slack', 'WhatsApp', 'Facebook', 'Messenger'];
const messages = [
  'Render finished successfully',
  'New DM from Jamie',
  'Disk space below 20%',
  'Build succeeded in pipeline n8n-prod',
  'GPU usage spiked during capture',
  'Upcoming meeting in 10 minutes'
];
const severities: NotificationItem['priority'][] = ['info', 'warning', 'critical'];

export async function getNotifications(): Promise<NotificationItem[]> {
  const now = Date.now();
  return Array.from({ length: 5 }).map((_, idx) => ({
    id: `n-${now}-${idx}`,
    title: messages[idx % messages.length],
    message: messages[idx % messages.length],
    source: sources[idx % sources.length],
    timestamp: new Date(now - idx * 60 * 1000),
    summary: messages[idx % messages.length],
    receivedAt: new Date(now - idx * 60 * 1000),
    priority: severities[idx % severities.length]
  }));
}
