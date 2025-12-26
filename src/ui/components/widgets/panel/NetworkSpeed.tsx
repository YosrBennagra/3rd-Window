
import { useMetrics } from '../../../../application/selectors';

export default function NetworkSpeed() {
  const metrics = useMetrics();
  
  if (!metrics) {
    return (
      <div className="widget-loading">
        <div className="loading-spinner"></div>
        <p className="muted tiny">Measuring network...</p>
      </div>
    );
  }

  const downSpeed = metrics.netDownMbps;
  const upSpeed = metrics.netUpMbps;
  const maxSpeed = 1000; // 1 Gbps reference

  return (
    <div className="network-widget">
      <div className="metric-header">
        <span className="metric-icon">🌐</span>
        <span className="metric-label">Network</span>
      </div>

      <div className="network-speeds">
        {/* Download Speed */}
        <div className="network-speed-card network-download">
          <div className="network-speed-header">
            <span className="network-speed-icon">⬇️</span>
            <span className="network-speed-label">Download</span>
          </div>
          <div className="network-speed-value">
            {downSpeed.toFixed(1)}<span className="network-speed-unit">Mbps</span>
          </div>
          <div className="network-speed-bar-track">
            <div 
              className="network-speed-bar network-speed-bar-download"
              style={{ width: `${Math.min((downSpeed / maxSpeed) * 100, 100)}%` }}
            >
              <div className="network-speed-bar-pulse"></div>
            </div>
          </div>
        </div>

        {/* Upload Speed */}
        <div className="network-speed-card network-upload">
          <div className="network-speed-header">
            <span className="network-speed-icon">⬆️</span>
            <span className="network-speed-label">Upload</span>
          </div>
          <div className="network-speed-value">
            {upSpeed.toFixed(1)}<span className="network-speed-unit">Mbps</span>
          </div>
          <div className="network-speed-bar-track">
            <div 
              className="network-speed-bar network-speed-bar-upload"
              style={{ width: `${Math.min((upSpeed / maxSpeed) * 100, 100)}%` }}
            >
              <div className="network-speed-bar-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="network-info">
        <div className="network-info-item">
          <span className="network-info-icon">📶</span>
          <span className="network-info-text">
            {downSpeed > 100 || upSpeed > 100 ? 'High Speed' : downSpeed > 10 || upSpeed > 10 ? 'Moderate' : 'Low Speed'}
          </span>
        </div>
      </div>
    </div>
  );
}
