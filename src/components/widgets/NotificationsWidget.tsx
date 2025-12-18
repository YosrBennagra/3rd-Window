import { useMemo } from 'react';

const sampleNotifications = [
  { source: 'Product Updates', message: 'Weekly rollout summary ready', time: '2m ago', unread: true },
  { source: 'Team Sync', message: 'Agenda for tomorrow published', time: '28m ago', unread: true },
  { source: 'Analytics', message: 'Daily metrics snapshot attached', time: '1h ago', unread: false },
  { source: 'Billing', message: 'Invoice #4921 ready for review', time: '3h ago', unread: false },
];

export function NotificationsWidget() {
  const notifications = useMemo(() => sampleNotifications, []);

  return (
    <div className="widget widget--large notifications-widget">
      <div className="widget__header">
        <span className="widget__icon">ĐY"ų</span>
        <div>
          <div className="widget__title">Notifications</div>
          <div className="widget__subtitle">Read-only alerts inside a 3x2 footprint</div>
        </div>
      </div>

      <div className="notifications-widget__list">
        {notifications.map((item, index) => (
          <div key={index} className={`notifications-widget__item ${item.unread ? 'notifications-widget__item--unread' : ''}`}>
            <div className="notifications-widget__meta">
              <span className="notifications-widget__source">{item.source}</span>
              <span className="notifications-widget__time">{item.time}</span>
            </div>
            <div className="notifications-widget__message">{item.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
