
import { useMetrics } from '../../state/selectors';
import { formatBytes } from '../../utils/system';

export default function DiskUsage() {
  const metrics = useMetrics();
  
  if (!metrics) {
    return (
      <div className="widget-loading">
        <div className="loading-spinner"></div>
        <p className="muted tiny">Loading disk data...</p>
      </div>
    );
  }

  const usedPct = (metrics.diskUsedBytes / metrics.diskTotalBytes) * 100;
  const freePct = 100 - usedPct;
  const diskStatus = usedPct > 90 ? 'critical' : usedPct > 80 ? 'warning' : 'normal';

  return (
    <div className="disk-widget">
      <div className="metric-header">
        <span className="metric-icon">💿</span>
        <span className="metric-label">Storage</span>
      </div>

      <div className="disk-stats-grid">
        <div className="disk-stat-card disk-stat-used">
          <div className="disk-stat-icon">📊</div>
          <div className="disk-stat-content">
            <div className="disk-stat-value">{usedPct.toFixed(1)}%</div>
            <div className="disk-stat-label">Used</div>
            <div className="disk-stat-size">{formatBytes(metrics.diskUsedBytes)}</div>
          </div>
        </div>

        <div className="disk-stat-card disk-stat-free">
          <div className="disk-stat-icon">📁</div>
          <div className="disk-stat-content">
            <div className="disk-stat-value">{freePct.toFixed(1)}%</div>
            <div className="disk-stat-label">Free</div>
            <div className="disk-stat-size">{formatBytes(metrics.diskTotalBytes - metrics.diskUsedBytes)}</div>
          </div>
        </div>
      </div>

      <div className="disk-bar-wrapper">
        <div className="disk-bar-track">
          <div 
            className={`disk-bar-fill disk-bar-${diskStatus}`}
            style={{ width: `${Math.min(usedPct, 100)}%` }}
          >
            <div className="disk-bar-shine"></div>
          </div>
        </div>
        <div className="disk-bar-labels">
          <span className="disk-bar-label-start">0</span>
          <span className="disk-bar-label-end">{formatBytes(metrics.diskTotalBytes)}</span>
        </div>
      </div>
    </div>
  );
}
