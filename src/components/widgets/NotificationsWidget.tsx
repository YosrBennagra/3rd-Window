import { useMemo } from 'react';
import type { WidgetLayout } from '../../types/layout';
import { ensureNotificationWidgetSettings } from '../../types/widgets';

interface DiscordNotification {
  id: string;
  server: string;
  channel: string;
  sender: string;
  message: string;
  timestamp: Date;
  unread: boolean;
  isMention: boolean;
  isDM: boolean;
}

// Sample Discord notifications
const sampleDiscordNotifications: DiscordNotification[] = [
  {
    id: '1',
    server: 'Dev Team',
    channel: 'general',
    sender: 'AlexK',
    message: '@everyone Deployment scheduled for 3pm',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    unread: true,
    isMention: true,
    isDM: false,
  },
  {
    id: '2',
    server: 'Dev Team',
    channel: 'frontend',
    sender: 'Sarah',
    message: 'Anyone tested the new grid layout?',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    unread: true,
    isMention: false,
    isDM: false,
  },
  {
    id: '3',
    server: 'Direct Messages',
    channel: 'DM',
    sender: 'Jamie',
    message: 'Quick sync at 2pm?',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    unread: false,
    isMention: false,
    isDM: true,
  },
  {
    id: '4',
    server: 'Design System',
    channel: 'announcements',
    sender: 'DesignBot',
    message: 'New color tokens available in Figma',
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    unread: false,
    isMention: false,
    isDM: false,
  },
];

interface Props {
  widget: WidgetLayout;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatAbsoluteTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const sourceLabels: Record<string, { name: string; icon: string }> = {
  discord: { name: 'Discord', icon: '💬' },
  mail: { name: 'Mail', icon: '✉️' },
  system: { name: 'System', icon: '🔔' },
  custom: { name: 'Custom', icon: '📌' },
};

export function NotificationsWidget({ widget }: Props) {
  const settings = ensureNotificationWidgetSettings(widget.settings);
  const sourceInfo = sourceLabels[settings.source] || sourceLabels.discord;
  
  // Determine if widget is compact based on size
  const isCompact = widget.width < 4 || widget.height < 3;

  // Render Discord notifications
  const renderDiscordNotifications = () => {
    const filtered = useMemo(() => {
      let result = sampleDiscordNotifications;
      
      if (settings.showMentionsOnly) {
        result = result.filter(n => n.isMention);
      }
      
      if (!settings.includeDMs) {
        result = result.filter(n => !n.isDM);
      }
      
      return result;
    }, []);

    const handleNotificationClick = (notification: DiscordNotification) => {
      if (!settings.openOnClick) return;
      console.log('Open Discord:', notification);
    };

    if (filtered.length === 0) {
      return (
        <div className="notifications-widget__empty">
          No Discord notifications
        </div>
      );
    }

    return filtered.map((notification) => (
      <div
        key={notification.id}
        className={`notifications-widget__item discord-item ${notification.unread ? 'notifications-widget__item--unread' : ''} ${settings.openOnClick ? 'notifications-widget__item--clickable' : ''}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="notifications-widget__header">
          <div className="notifications-widget__context">
            {!isCompact && (
              <>
                <span className="notifications-widget__server">
                  {notification.server}
                </span>
                <span className="notifications-widget__separator">/</span>
              </>
            )}
            <span className="notifications-widget__channel">
              {notification.isDM ? notification.sender : `#${notification.channel}`}
            </span>
          </div>
          <span className="notifications-widget__time">
            {settings.timeFormat === 'relative' 
              ? formatRelativeTime(notification.timestamp)
              : formatAbsoluteTime(notification.timestamp)
            }
          </span>
        </div>
        
        <div className="notifications-widget__content">
          {!notification.isDM && (
            <span className="notifications-widget__sender">
              {notification.sender}:
            </span>
          )}
          <span className={`notifications-widget__message ${notification.isMention ? 'notifications-widget__message--mention' : ''}`}>
            {notification.message}
          </span>
        </div>

        {notification.unread && (
          <div className="notifications-widget__unread-indicator" />
        )}
      </div>
    ));
  };

  // Render placeholder for inactive sources
  const renderPlaceholder = (sourceName: string) => (
    <div className="notifications-widget__empty">
      <div className="notifications-widget__placeholder-icon">🚧</div>
      <div className="notifications-widget__placeholder-text">
        {sourceName} notifications are not available yet
      </div>
      <div className="notifications-widget__placeholder-hint">
        Configure this widget via right-click → Settings
      </div>
    </div>
  );

  // Determine what to render based on source
  const renderContent = () => {
    switch (settings.source) {
      case 'discord':
        return renderDiscordNotifications();
      case 'mail':
        return renderPlaceholder('Mail');
      case 'system':
        return renderPlaceholder('System');
      case 'custom':
        return renderPlaceholder('Custom');
      default:
        return renderPlaceholder('Unknown');
    }
  };

  return (
    <div className="widget notifications-widget">
      <div className="widget__header">
        <span className="widget__icon">{sourceInfo.icon}</span>
        <div>
          <div className="widget__title">{sourceInfo.name}</div>
          {!isCompact && <div className="widget__subtitle">Notification feed</div>}
        </div>
      </div>

      <div className="notifications-widget__list">
        {renderContent()}
      </div>
    </div>
  );
}
