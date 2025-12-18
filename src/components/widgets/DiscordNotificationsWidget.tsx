import { useMemo } from 'react';
import type { WidgetLayout } from '../../types/layout';
import { ensureDiscordNotificationsSettings } from '../../types/widgets';

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

// Sample Discord notifications for demo
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

export function DiscordNotificationsWidget({ widget }: Props) {
  const settings = ensureDiscordNotificationsSettings(widget.settings);
  
  // Determine if widget is compact based on size
  const isCompact = widget.width < 4 || widget.height < 3;
  
  const filteredNotifications = useMemo(() => {
    let filtered = sampleDiscordNotifications;
    
    // Filter by mentions only
    if (settings.showMentionsOnly) {
      filtered = filtered.filter(n => n.isMention);
    }
    
    // Filter direct messages
    if (!settings.includeDMs) {
      filtered = filtered.filter(n => !n.isDM);
    }
    
    return filtered;
  }, [settings.showMentionsOnly, settings.includeDMs]);

  const handleNotificationClick = (notification: DiscordNotification) => {
    if (!settings.openDiscordOnClick) return;
    
    // Deep link to Discord (would need actual implementation)
    console.log('Open Discord:', notification);
  };

  return (
    <div className="widget discord-notifications-widget">
      <div className="widget__header">
        <span className="widget__icon">💬</span>
        <div>
          <div className="widget__title">Discord</div>
          {!isCompact && <div className="widget__subtitle">Read-only notifications</div>}
        </div>
      </div>

      <div className="discord-notifications-widget__list">
        {filteredNotifications.length === 0 ? (
          <div className="discord-notifications-widget__empty">
            No notifications
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`discord-notifications-widget__item ${notification.unread ? 'discord-notifications-widget__item--unread' : ''} ${settings.openDiscordOnClick ? 'discord-notifications-widget__item--clickable' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="discord-notifications-widget__header">
                <div className="discord-notifications-widget__context">
                  {!isCompact && (
                    <>
                      <span className="discord-notifications-widget__server">
                        {notification.server}
                      </span>
                      <span className="discord-notifications-widget__separator">/</span>
                    </>
                  )}
                  <span className="discord-notifications-widget__channel">
                    {notification.isDM ? notification.sender : `#${notification.channel}`}
                  </span>
                </div>
                <span className="discord-notifications-widget__time">
                  {settings.timeFormat === 'relative' 
                    ? formatRelativeTime(notification.timestamp)
                    : formatAbsoluteTime(notification.timestamp)
                  }
                </span>
              </div>
              
              <div className="discord-notifications-widget__content">
                {!notification.isDM && (
                  <span className="discord-notifications-widget__sender">
                    {notification.sender}:
                  </span>
                )}
                <span className={`discord-notifications-widget__message ${notification.isMention ? 'discord-notifications-widget__message--mention' : ''}`}>
                  {notification.message}
                </span>
              </div>

              {notification.unread && (
                <div className="discord-notifications-widget__unread-indicator" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
