
import { useAlerts } from '../../../../application/selectors';
import { formatRelative } from '../../../../utils/system';

const severityLabel: Record<string, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical'
};

export function Alerts() {
  const alerts = useAlerts();

  if (!alerts.length) return <p className="muted">No active alerts</p>;

  return (
    <div className="list">
      {alerts.map((a) => (
        <div key={a.id} className="list-row">
          <div>
            <p className="list-title">{a.title}</p>
            <p className="muted tiny">{a.message}</p>
            <p className="muted tiny">{formatRelative(a.createdAt.getTime())}</p>
          </div>
          <span className={`badge badge--${a.severity}`}>{severityLabel[a.severity]}</span>
        </div>
      ))}
    </div>
  );
}
