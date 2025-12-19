import { useEffect, useState } from 'react';
import type { WidgetLayout } from '../../types/layout';
import { ensureNotificationWidgetSettings } from '../../types/widgets';
import { discordService } from '../../services/discord';
import type { DiscordDMNotification, DiscordAuthState } from '../../types/discord';

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
  
  // Discord state
  const [discordAuth, setDiscordAuth] = useState<DiscordAuthState | null>(null);
  const [discordDMs, setDiscordDMs] = useState<DiscordDMNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine if widget is compact based on size
  const isCompact = widget.width < 4 || widget.height < 3;

  // Load Discord auth state and DMs
  useEffect(() => {
    if (settings.source !== 'discord') return;

    const loadDiscord = async () => {
      setIsLoading(true);
      try {
        const auth = await discordService.getAuthState();
        setDiscordAuth(auth);
        
        if (auth.isConnected) {
          const dms = await discordService.getDMs(10);
          setDiscordDMs(dms);
        }
      } catch (error) {
        console.error('[NotificationsWidget] Failed to load Discord:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDiscord();

    // Refresh DMs periodically
    const interval = setInterval(() => {
      if (discordService.isConnected()) {
        discordService.getDMs(10).then(setDiscordDMs).catch(console.error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [settings.source]);

  // Render Discord notifications
  const renderDiscordNotifications = () => {
    if (!discordAuth?.isConnected) {
      return (
        <div className="notifications-widget__empty">
          <div className="notifications-widget__placeholder-icon">🔗</div>
          <div className="notifications-widget__placeholder-text">
            Account not linked
          </div>
          <div className="notifications-widget__placeholder-hint">
            Right-click → Settings to connect
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="notifications-widget__empty">
          <div className="notifications-widget__placeholder-text">
            Loading Discord DMs...
          </div>
        </div>
      );
    }

    if (discordDMs.length === 0) {
      return (
        <div className="notifications-widget__empty">
          <div className="notifications-widget__placeholder-icon">💬</div>
          <div className="notifications-widget__placeholder-text">
            No Discord DMs
          </div>
          <div className="notifications-widget__placeholder-hint">
            Connected as {discordAuth.user?.username}
          </div>
        </div>
      );
    }

    const handleDMClick = (dm: DiscordDMNotification) => {
      if (!settings.openOnClick) return;
      discordService.openDM(dm.channelId).catch(console.error);
    };

    return (
      <>
        {discordDMs.map((dm) => {
          const timestamp = new Date(dm.timestamp);
          const displayName = dm.sender.globalName || dm.sender.username;
          
          return (
            <div
              key={dm.id}
              className={`notifications-widget__item discord-item ${
                dm.isUnread ? 'notifications-widget__item--unread' : ''
              } ${
                settings.openOnClick ? 'notifications-widget__item--clickable' : ''
              }`}
              onClick={() => handleDMClick(dm)}
            >
              <div className="notifications-widget__header">
                <div className="notifications-widget__context">
                  <span className="discord-logo">💬</span>
                  <span className="notifications-widget__sender">
                    {displayName}
                  </span>
                </div>
                <span className="notifications-widget__time">
                  {settings.timeFormat === 'relative' 
                    ? formatRelativeTime(timestamp)
                    : formatAbsoluteTime(timestamp)
                  }
                </span>
              </div>
              
              <div className="notifications-widget__content">
                <span className="notifications-widget__message">
                  {dm.content.length > 100
                    ? dm.content.substring(0, 100) + '...'
                    : dm.content
                  }
                </span>
              </div>

              {dm.isUnread && (
                <div className="notifications-widget__unread-indicator" />
              )}
            </div>
          );
        })}
      </>
    );

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
