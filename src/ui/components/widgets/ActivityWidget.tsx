import { useEffect, useState } from 'react';
import { IpcService } from '../../../services/ipc';
import type { WidgetLayout } from '../../../domain/models/layout';

interface ActivityData {
  systemUptime: number; // seconds
  activeApp: string;
  activeAppDuration: number; // seconds
}

interface Props {
  widget: WidgetLayout;
}

export default function ActivityWidget({ widget: _widget }: Props) {
  const [activityData, setActivityData] = useState<ActivityData>({
    systemUptime: 0,
    activeApp: 'Unknown',
    activeAppDuration: 0,
  });

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const uptime = await IpcService.metrics.getSystemUptime();
        const activeWindow = await IpcService.metrics.getActiveWindow();
        
        setActivityData({
          systemUptime: uptime,
          activeApp: activeWindow.name,
          activeAppDuration: activeWindow.duration,
        });
      } catch {
        // Silent error - widget will show no activity
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="widget activity-widget">
      <div className="activity-widget__content">
        <div className="activity-section">
          <div className="activity-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
          </div>
          <div className="activity-info">
            <div className="activity-label">System Uptime</div>
            <div className="activity-value">{formatUptime(activityData.systemUptime)}</div>
          </div>
        </div>

        <div className="activity-divider" />

        <div className="activity-section">
          <div className="activity-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </div>
          <div className="activity-info">
            <div className="activity-label">Active App</div>
            <div className="activity-app-name">{activityData.activeApp}</div>
            <div className="activity-duration">{formatDuration(activityData.activeAppDuration)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
