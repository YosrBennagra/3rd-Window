
import { useMetrics } from '../../../application/selectors';

export default function Temperature() {
  const metrics = useMetrics();
  
  if (!metrics) {
    return (
      <div className="widget-loading">
        <div className="loading-spinner"></div>
        <p className="muted tiny">Loading system data...</p>
      </div>
    );
  }

  const cpuData = {
    label: 'CPU',
    usage: metrics.cpuUsage,
    temp: metrics.cpuTemp,
    tempStatus: metrics.cpuTemp > 80 ? 'critical' : metrics.cpuTemp > 70 ? 'warning' : 'normal',
  };

  const gpuData = {
    label: 'GPU',
    temp: metrics.gpuTemp,
    tempStatus: metrics.gpuTemp > 85 ? 'critical' : metrics.gpuTemp > 75 ? 'warning' : 'normal',
  };

  return (
    <div className="metrics-grid">
      {/* CPU Section */}
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-icon">🖥️</span>
          <span className="metric-label">{cpuData.label}</span>
        </div>
        
        <div className="metric-primary">
          <div className="metric-value-large">{cpuData.usage.toFixed(1)}<span className="metric-unit">%</span></div>
          <div className="metric-label-sub">Usage</div>
        </div>

        {cpuData.temp > 0 && (
          <div className="metric-secondary">
            <div className={`temp-badge temp-${cpuData.tempStatus}`}>
              <span className="temp-value">{cpuData.temp.toFixed(1)}°</span>
            </div>
            <div className="temp-bar-container">
              <div 
                className={`temp-bar temp-bar-${cpuData.tempStatus}`}
                style={{ width: `${Math.min((cpuData.temp / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* GPU Section */}
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-icon">🎮</span>
          <span className="metric-label">{gpuData.label}</span>
        </div>
        
        {gpuData.temp > 0 ? (
          <>
            <div className="metric-primary">
              <div className="metric-value-large">{gpuData.temp.toFixed(1)}<span className="metric-unit">°C</span></div>
              <div className="metric-label-sub">Temperature</div>
            </div>

            <div className="metric-secondary">
              <div className="temp-bar-container">
                <div 
                  className={`temp-bar temp-bar-${gpuData.tempStatus}`}
                  style={{ width: `${Math.min((gpuData.temp / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="metric-unavailable">
            <p className="muted tiny">No GPU detected</p>
          </div>
        )}
      </div>
    </div>
  );
}
