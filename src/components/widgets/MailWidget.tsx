import { useMemo } from 'react';

const sampleMail = [
  { from: 'Product Updates', subject: 'Your weekly rollout summary', time: '2m ago', unread: true },
  { from: 'Team Sync', subject: 'Agenda for tomorrow', time: '28m ago', unread: true },
  { from: 'Analytics', subject: 'Daily metrics snapshot attached', time: '1h ago', unread: false },
  { from: 'Billing', subject: 'Invoice #4921 ready', time: '3h ago', unread: false },
];

export function MailWidget() {
  const mailItems = useMemo(() => sampleMail, []);

  return (
    <div className="widget widget--large mail-widget">
      <div className="widget__header">
        <span className="widget__icon">📨</span>
        <div>
          <div className="widget__title">Inbox</div>
          <div className="widget__subtitle">Snaps to a 3×2 grid footprint</div>
        </div>
      </div>

      <div className="mail-widget__list">
        {mailItems.map((item, index) => (
          <div key={index} className={`mail-widget__item ${item.unread ? 'mail-widget__item--unread' : ''}`}>
            <div className="mail-widget__meta">
              <span className="mail-widget__from">{item.from}</span>
              <span className="mail-widget__time">{item.time}</span>
            </div>
            <div className="mail-widget__subject">{item.subject}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
