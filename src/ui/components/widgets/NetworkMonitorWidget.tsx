import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { WidgetLayout } from '../../../domain/models/layout';
import { ensureNetworkMonitorWidgetSettings } from '../../../domain/models/widgets';

interface NetworkStats {
  interfaceName: string;
  downloadSpeed: number; // bytes per second
  uploadSpeed: number; // bytes per second
  totalDownloaded: number; // bytes
  totalUploaded: number; // bytes
  isConnected: boolean;
}

interface Props {
  widget: WidgetLayout;
}

export default function NetworkMonitorWidget({ widget }: Props) {
  const settings = ensureNetworkMonitorWidgetSettings(widget.settings);
  const [stats, setStats] = useState<NetworkStats>({
    interfaceName: 'Detecting...',
    downloadSpeed: 0,
    uploadSpeed: 0,
    totalDownloaded: 0,
    totalUploaded: 0,
    isConnected: false,
  });

  useEffect(() => {
    const fetchNetworkStats = async () => {
      try {
        const data = await invoke<NetworkStats>('get_network_stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch network stats:', error);
        // Keep showing last known stats on error
      }
    };

    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, settings.refreshInterval);

    return () => clearInterval(interval);
  }, [settings.refreshInterval]);

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  const getSpeedColor = (bytesPerSecond: number): string => {
    const mbps = bytesPerSecond / (1024 * 1024);
    if (mbps < 1) return 'rgba(255, 255, 255, 0.5)';
    if (mbps < 10) return '#4ade80';
    if (mbps < 50) return '#fbbf24';
    return '#f87171';
  };

  const getSpeedBar = (bytesPerSecond: number, maxBytes: number): number => {
    if (maxBytes === 0) return 0;
    return Math.min((bytesPerSecond / maxBytes) * 100, 100);
  };

  const maxSpeed = Math.max(stats.downloadSpeed, stats.uploadSpeed) || 1024 * 1024; // Default 1 MB/s

  return (
    <div
      className="widget-content"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="2" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.7 }}>
            Network
          </span>
        </div>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: stats.isConnected ? '#4ade80' : '#f87171',
          }}
          title={stats.isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {/* Interface Name */}
      {settings.showInterface && (
        <div style={{ fontSize: '11px', opacity: 0.5, textAlign: 'center' }}>
          {stats.interfaceName}
        </div>
      )}

      {/* Download Speed */}
      {settings.showDownload && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>Down</span>
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: getSpeedColor(stats.downloadSpeed),
              }}
            >
              {formatSpeed(stats.downloadSpeed)}
            </span>
          </div>
          {settings.showBars && (
            <div
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${getSpeedBar(stats.downloadSpeed, maxSpeed)}%`,
                  height: '100%',
                  background: getSpeedColor(stats.downloadSpeed),
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Speed */}
      {settings.showUpload && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>Up</span>
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: getSpeedColor(stats.uploadSpeed),
              }}
            >
              {formatSpeed(stats.uploadSpeed)}
            </span>
          </div>
          {settings.showBars && (
            <div
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${getSpeedBar(stats.uploadSpeed, maxSpeed)}%`,
                  height: '100%',
                  background: getSpeedColor(stats.uploadSpeed),
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Total Data Transfer */}
      {settings.showTotals && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-around',
            fontSize: '10px',
            opacity: 0.6,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div>Total ↓</div>
            <div style={{ fontWeight: '600', marginTop: '2px' }}>
              {formatBytes(stats.totalDownloaded)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div>Total ↑</div>
            <div style={{ fontWeight: '600', marginTop: '2px' }}>
              {formatBytes(stats.totalUploaded)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
