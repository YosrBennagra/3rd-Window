import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { WidgetLayout } from '../../types/layout';

interface SystemMetrics {
  cpuUsage: number;
  cpuTemp: number;
  gpuTemp: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  netUpMbps: number;
  netDownMbps: number;
}

interface Props {
  widget: WidgetLayout;
}

export default function DiskUsageWidget({ widget: _widget }: Props) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await invoke<SystemMetrics>('get_system_metrics');
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch system metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5s (disk changes slowly)

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const usedBytes = metrics?.diskUsedBytes ?? 0;
  const totalBytes = metrics?.diskTotalBytes ?? 1;
  const usedPct = (usedBytes / totalBytes) * 100;
  const freeBytes = totalBytes - usedBytes;
  const freePct = 100 - usedPct;

  const getColor = () => {
    if (usedPct > 90) return '#ef4444';
    if (usedPct > 80) return '#fbbf24';
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
        <div style={{ fontSize: '20px' }}>💿</div>
        <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.7 }}>
          Storage
        </span>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        flex: 1
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '10px', opacity: 0.5 }}>Used</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: getColor()
          }}>
            {usedPct.toFixed(1)}%
          </div>
          <div style={{ fontSize: '10px', opacity: 0.6 }}>
            {formatBytes(usedBytes)}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '10px', opacity: 0.5 }}>Free</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#4ade80'
          }}>
            {freePct.toFixed(1)}%
          </div>
          <div style={{ fontSize: '10px', opacity: 0.6 }}>
            {formatBytes(freeBytes)}
          </div>
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
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Total */}
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        opacity: 0.5,
        marginTop: 'auto'
      }}>
        Total: {formatBytes(totalBytes)}
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
