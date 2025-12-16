import React from 'react';
import { useNotifications } from '../../state/selectors';
import { formatRelative } from '../../utils/system';

export default function Notifications() {
  const notifications = useNotifications();

  if (!notifications.length) return <p className="muted">No notifications</p>;

  return (
    <div className="list">
      {notifications.map((n) => (
        <div key={n.id} className="list-row">
          <div>
            <div className="pill pill--ghost">{n.source}</div>
            <p className="list-title">{n.summary}</p>
            <p className="muted tiny">{formatRelative(n.receivedAt)}</p>
          </div>
          <span className={`badge badge--${n.priority}`}>{n.priority}</span>
        </div>
      ))}
    </div>
  );
}
