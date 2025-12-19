
import { useMetrics } from '../../state/selectors';
import { formatBytes } from '../../utils/system';

export default function RamUsage() {
  const metrics = useMetrics();
  
  if (!metrics) {
    return (
      <div className="widget-loading">
        <div className="loading-spinner"></div>
        <p className="muted tiny">Loading memory data...</p>
      </div>
    );
  }

  const usedPct = (metrics.ramUsedBytes / metrics.ramTotalBytes) * 100;
  const memStatus = usedPct > 90 ? 'critical' : usedPct > 75 ? 'warning' : 'normal';

  return (
    <div className="memory-widget">
      <div className="metric-header">
        <span className="metric-icon">💾</span>
        <span className="metric-label">Memory</span>
      </div>

      <div className="metric-primary">
        <div className="metric-value-large">
          {usedPct.toFixed(0)}<span className="metric-unit">%</span>
        </div>
        <div className="metric-label-sub">In use</div>
      </div>

      <div className="memory-bar-wrapper">
        <div className="memory-bar-track">
          <div 
            className={`memory-bar-fill memory-bar-${memStatus}`}
            style={{ width: `${Math.min(usedPct, 100)}%` }}
          >
            <div className="memory-bar-glow"></div>
          </div>
        </div>
      </div>

      <div className="memory-stats">
        <div className="memory-stat-item">
          <span className="memory-stat-label">Used</span>
          <span className="memory-stat-value">{formatBytes(metrics.ramUsedBytes)}</span>
        </div>
        <div className="memory-stat-divider"></div>
        <div className="memory-stat-item">
          <span className="memory-stat-label">Total</span>
          <span className="memory-stat-value">{formatBytes(metrics.ramTotalBytes)}</span>
        </div>
      </div>
    </div>
  );
}
