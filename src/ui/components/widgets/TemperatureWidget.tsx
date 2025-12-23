import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { WidgetLayout } from '../../../domain/models/layout';

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

export default function TemperatureWidget({ widget: _widget }: Props) {
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
    const interval = setInterval(fetchMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  const getTempColor = (temp: number, isCpu: boolean = true) => {
    const warningThreshold = isCpu ? 70 : 75;
    const criticalThreshold = isCpu ? 80 : 85;
    
    if (temp < warningThreshold) return '#4ade80';
    if (temp < criticalThreshold) return '#fbbf24';
    return '#ef4444';
  };

  const cpuTemp = metrics?.cpuTemp ?? 0;
  const gpuTemp = metrics?.gpuTemp ?? 0;
  const cpuUsage = metrics?.cpuUsage ?? 0;

  return (
    <div
      className="widget-content"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
      }}
    >
      {/* CPU Temperature */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '20px' }}>🖥️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>CPU</div>
            <div style={{ fontSize: '12px', opacity: 0.5 }}>{cpuUsage.toFixed(0)}% Usage</div>
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: cpuTemp > 0 ? getTempColor(cpuTemp, true) : 'rgba(255,255,255,0.3)'
          }}>
            {cpuTemp > 0 ? `${Math.round(cpuTemp)}°` : '--°'}
          </div>
        </div>
        
        {cpuTemp > 0 && (
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min((cpuTemp / 100) * 100, 100)}%`,
              height: '100%',
              background: getTempColor(cpuTemp, true),
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </div>

      {/* GPU Temperature */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '20px' }}>🎮</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>GPU</div>
            <div style={{ fontSize: '12px', opacity: 0.5 }}>Graphics Card</div>
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: gpuTemp > 0 ? getTempColor(gpuTemp, false) : 'rgba(255,255,255,0.3)'
          }}>
            {gpuTemp > 0 ? `${Math.round(gpuTemp)}°` : '--°'}
          </div>
        </div>
        
        {gpuTemp > 0 && (
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min((gpuTemp / 100) * 100, 100)}%`,
              height: '100%',
              background: getTempColor(gpuTemp, false),
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
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
