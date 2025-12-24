import { useSystemMetrics } from '../../../hooks/useSystemMetrics';
import type { WidgetLayout } from '../../../domain/models/layout';

interface Props {
  widget: WidgetLayout;
}

export default function RamUsageWidget({ widget: _widget }: Props) {
  // Use optimized hook with 3s refresh (RAM changes slowly)
  const { metrics } = useSystemMetrics({
    refreshInterval: 3000,
    pauseWhenHidden: true,
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const usedBytes = metrics?.memoryUsed ?? 0;
  const totalBytes = metrics?.memoryTotal ?? 1;
  const usedPct = (usedBytes / totalBytes) * 100;
  const freeBytes = totalBytes - usedBytes;

  const getColor = () => {
    if (usedPct > 90) return '#ef4444';
    if (usedPct > 75) return '#fbbf24';
    return '#4ade80';
  };

  return (
    <div
      className="widget-content"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '20px' }}>💾</div>
        <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.7 }}>
          Memory
        </span>
      </div>

      {/* Main Display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '600',
            color: getColor()
          }}>
            {usedPct.toFixed(0)}%
          </div>
          <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
            In Use
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(usedPct, 100)}%`,
            height: '100%',
            background: getColor(),
            transition: 'width 0.3s ease',
            boxShadow: `0 0 8px ${getColor()}40`
          }} />
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          opacity: 0.6,
          marginTop: 'auto'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div>Used</div>
            <div style={{ fontWeight: '600', marginTop: '2px', opacity: 0.9 }}>
              {formatBytes(usedBytes)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div>Free</div>
            <div style={{ fontWeight: '600', marginTop: '2px', opacity: 0.9 }}>
              {formatBytes(freeBytes)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div>Total</div>
            <div style={{ fontWeight: '600', marginTop: '2px', opacity: 0.9 }}>
              {formatBytes(totalBytes)}
            </div>
          </div>
        </div>
      </div>

      {!metrics && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          fontSize: '11px',
          opacity: 0.5
        }}>
          Loading...
        </div>
      )}
    </div>
  );
}
