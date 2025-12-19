import { useEffect, useMemo, useState } from 'react';
import type { WidgetLayout } from '../../types/layout';
import type { ClockWidgetSettings, NotificationWidgetSettings } from '../../types/widgets';
import { ensureClockWidgetSettings, ensureNotificationWidgetSettings } from '../../types/widgets';
import './Panel.css';

const widgetNames: Record<string, string> = {
  clock: 'Clock',
  'cpu-temp': 'CPU Temperature',
  'gpu-temp': 'GPU Temperature',
  notifications: 'Notifications',
};

interface Props {
  widget: WidgetLayout;
  previewSettings?: ClockWidgetSettings | NotificationWidgetSettings;
  onPreviewChange: (settings: ClockWidgetSettings | NotificationWidgetSettings) => void;
  onApply: (settings: ClockWidgetSettings | NotificationWidgetSettings) => Promise<void> | void;
  onCancel: () => void;
}

const dateFormatLabels: Record<ClockWidgetSettings['dateFormat'], string> = {
  none: 'None (time only)',
  short: 'Short - Thu, Dec 18',
  medium: 'Medium - Thursday, Dec 18',
  long: 'Long - Thursday, December 18, 2025',
};

const layoutStyleLabels: Record<ClockWidgetSettings['layoutStyle'], string> = {
  stacked: 'Stacked (time above date)',
  inline: 'Inline (time + date on one line)',
  minimal: 'Minimal (time only)',
};

const alignmentLabels: Record<ClockWidgetSettings['alignment'], string> = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
};

const fontSizeLabels: Record<ClockWidgetSettings['fontSizeMode'], string> = {
  auto: 'Auto (resize with widget)',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

export default function WidgetSettingsPanel({ widget, previewSettings, onPreviewChange, onApply, onCancel }: Props) {
  const widgetName = widgetNames[widget.widgetType] || widget.widgetType;
  const baseSettings = useMemo(
    () => ensureClockWidgetSettings(previewSettings ?? widget.settings),
    [previewSettings, widget],
  );
  const [draft, setDraft] = useState<ClockWidgetSettings>(baseSettings);
  const [timezoneInput, setTimezoneInput] = useState(
    baseSettings.timezone === 'system' ? '' : baseSettings.timezone,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDraft(baseSettings);
    setTimezoneInput(baseSettings.timezone === 'system' ? '' : baseSettings.timezone);
  }, [baseSettings]);

  const timezoneOptions = useMemo(() => {
    if (typeof Intl !== 'undefined' && typeof (Intl as typeof Intl & { supportedValuesOf?: (value: string) => string[] }).supportedValuesOf === 'function') {
      try {
        return (Intl as any).supportedValuesOf('timeZone');
      } catch {
        // fall back to defaults
      }
    }
    return ['UTC', 'Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney'];
  }, []);

  const handleUpdate = (partial: Partial<ClockWidgetSettings>) => {
    const next = ensureClockWidgetSettings({ ...draft, ...partial });
    setDraft(next);
    onPreviewChange(next);
  };

  const handleTimezoneSelect = (value: string) => {
    if (value === 'system') {
      handleUpdate({ timezone: 'system' });
      setTimezoneInput('');
    } else {
      handleUpdate({ timezone: value });
      setTimezoneInput(value);
    }
  };

  const handleTimezoneInput = (value: string) => {
    setTimezoneInput(value);
    handleUpdate({ timezone: value.trim() === '' ? 'system' : value.trim() });
  };

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      await onApply(draft);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const renderClockSettings = () => (
    <>
      <section className="panel__section">
        <h3 className="panel__section-title">Time & Date</h3>
        <div className="panel__control-group">
          <label className="panel__control-label">Time Format</label>
          <div className="panel__options">
            <label className="panel__option">
              <input
                type="radio"
                name={`${widget.id}-time-format`}
                checked={draft.timeFormat === '12h'}
                onChange={() => handleUpdate({ timeFormat: '12h' })}
              />
              12-hour (AM / PM)
            </label>
            <label className="panel__option">
              <input
                type="radio"
                name={`${widget.id}-time-format`}
                checked={draft.timeFormat === '24h'}
                onChange={() => handleUpdate({ timeFormat: '24h' })}
              />
              24-hour
            </label>
          </div>
        </div>

        <div className="panel__control-group">
          <label className="panel__control-label">Seconds Display</label>
          <div className="panel__options">
            <label className="panel__option">
              <input
                type="radio"
                name={`${widget.id}-seconds`}
                checked={draft.showSeconds}
                onChange={() => handleUpdate({ showSeconds: true })}
              />
              Show seconds
            </label>
            <label className="panel__option">
              <input
                type="radio"
                name={`${widget.id}-seconds`}
                checked={!draft.showSeconds}
                onChange={() => handleUpdate({ showSeconds: false })}
              />
              Hide seconds
            </label>
          </div>
        </div>

        <div className="panel__control-group">
          <label className="panel__control-label">Update Frequency</label>
          <div className="panel__options">
            <label className="panel__option">
              <input
                type="radio"
                name={`${widget.id}-frequency`}
                checked={draft.updateFrequency === 'second'}
                onChange={() => handleUpdate({ updateFrequency: 'second' })}
              />
              Every second
            </label>
            <label className="panel__option">
              <input
                type="radio"
                name={`${widget.id}-frequency`}
                checked={draft.updateFrequency === 'minute'}
                onChange={() => handleUpdate({ updateFrequency: 'minute' })}
              />
              Every minute
            </label>
          </div>
        </div>

        <div className="panel__control-group">
          <label className="panel__control-label">Date Display</label>
          <div className="panel__options panel__options--column">
            {(Object.keys(dateFormatLabels) as Array<ClockWidgetSettings['dateFormat']>).map((format) => (
              <label key={format} className="panel__option">
                <input
                  type="radio"
                  name={`${widget.id}-date-format`}
                  checked={draft.dateFormat === format}
                  onChange={() => handleUpdate({ dateFormat: format })}
                />
                {dateFormatLabels[format]}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="panel__section">
        <h3 className="panel__section-title">Appearance</h3>
        <div className="panel__control-group">
          <label className="panel__control-label">Layout Style</label>
          <div className="panel__options panel__options--column">
            {(Object.keys(layoutStyleLabels) as Array<ClockWidgetSettings['layoutStyle']>).map((value) => (
              <label key={value} className="panel__option">
                <input
                  type="radio"
                  name={`${widget.id}-layout-style`}
                  checked={draft.layoutStyle === value}
                  onChange={() => handleUpdate({ layoutStyle: value })}
                />
                {layoutStyleLabels[value]}
              </label>
            ))}
          </div>
        </div>

        <div className="panel__control-group">
          <label className="panel__control-label">Alignment</label>
          <div className="panel__options">
            {(Object.keys(alignmentLabels) as Array<ClockWidgetSettings['alignment']>).map((value) => (
              <label key={value} className="panel__option">
                <input
                  type="radio"
                  name={`${widget.id}-alignment`}
                  checked={draft.alignment === value}
                  onChange={() => handleUpdate({ alignment: value })}
                />
                {alignmentLabels[value]}
              </label>
            ))}
          </div>
        </div>

        <div className="panel__control-group">
          <label className="panel__control-label">Font Size</label>
          <div className="panel__options panel__options--column">
            {(Object.keys(fontSizeLabels) as Array<ClockWidgetSettings['fontSizeMode']>).map((value) => (
              <label key={value} className="panel__option">
                <input
                  type="radio"
                  name={`${widget.id}-font-size`}
                  checked={draft.fontSizeMode === value}
                  onChange={() => handleUpdate({ fontSizeMode: value })}
                />
                {fontSizeLabels[value]}
              </label>
            ))}
          </div>
        </div>

        <div className="panel__control-group">
          <label className="panel__control-label">Click Behavior</label>
          <div className="panel__options panel__options--column">
            <label className="panel__option">
              <input
                type="radio"
                name={`${widget.id}-click-behavior`}
                checked={draft.clickBehavior === 'open-system-clock'}
                onChange={() => handleUpdate({ clickBehavior: 'open-system-clock' })}
              />
              Open system clock
            </label>
            <label className="panel__option">
              <input
                type="radio"
                name={`${widget.id}-click-behavior`}
                checked={draft.clickBehavior === 'none'}
                onChange={() => handleUpdate({ clickBehavior: 'none' })}
              />
              Do nothing
            </label>
          </div>
        </div>
      </section>

      <section className="panel__section">
        <h3 className="panel__section-title">Timezone</h3>
        <div className="panel__control-group">
          <label className="panel__control-label">Timezone</label>
          <div className="panel__stack">
            <select
              className="panel__select"
              value={draft.timezone === 'system' ? 'system' : draft.timezone}
              onChange={(e) => handleTimezoneSelect(e.target.value)}
            >
              <option value="system">System timezone</option>
              {timezoneOptions.map((tz: string) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
              {draft.timezone !== 'system' && !timezoneOptions.includes(draft.timezone) && (
                <option value={draft.timezone}>{draft.timezone}</option>
              )}
            </select>
            <input
              className="panel__text-input"
              type="text"
              list="clock-timezone-options"
              placeholder="e.g. Europe/Paris"
              value={timezoneInput}
              onChange={(e) => handleTimezoneInput(e.target.value)}
            />
            <datalist id="clock-timezone-options">
              {timezoneOptions.map((tz: string) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
          </div>
          <p className="panel__hint">Custom timezone is shown under the clock whenever the date is visible.</p>
        </div>
      </section>
    </>
  );

  const renderNotificationSettings = () => {
    const notifSettings = ensureNotificationWidgetSettings(previewSettings ?? widget.settings);
    const [notifDraft, setNotifDraft] = useState(notifSettings);
    const [discordAuth, setDiscordAuth] = useState<any>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Load Discord auth state
    useEffect(() => {
      if (notifDraft.source === 'discord') {
        import('../../services/discord').then(({ discordService }) => {
          discordService.getAuthState().then(setDiscordAuth).catch(console.error);
        });
      }
    }, [notifDraft.source]);

    useEffect(() => {
      setNotifDraft(ensureNotificationWidgetSettings(previewSettings ?? widget.settings));
    }, [previewSettings, widget]);

    const handleNotifUpdate = (partial: Partial<NotificationWidgetSettings>) => {
      const next = ensureNotificationWidgetSettings({ ...notifDraft, ...partial });
      setNotifDraft(next);
      onPreviewChange(next);
    };

    const handleDiscordConnect = async () => {
      setIsConnecting(true);
      try {
        const { discordService } = await import('../../services/discord');
        await discordService.startOAuthFlow();
        
        // In a real app, we'd need a callback handler
        // For now, show instructions
        alert('Please complete the Discord authorization in your browser, then paste the authorization code here.');
        const code = prompt('Enter authorization code:');
        
        if (code) {
          const result = await discordService.connect(code);
          if (result.connected) {
            const auth = await discordService.getAuthState();
            setDiscordAuth(auth);
          } else {
            alert('Failed to connect: ' + (result.error || 'Unknown error'));
          }
        }
      } catch (error) {
        console.error('[Settings] Discord connect failed:', error);
        alert('Failed to connect to Discord');
      } finally {
        setIsConnecting(false);
      }
    };

    const handleDiscordDisconnect = async () => {
      try {
        const { discordService } = await import('../../services/discord');
        await discordService.disconnect();
        setDiscordAuth(null);
      } catch (error) {
        console.error('[Settings] Discord disconnect failed:', error);
      }
    };

    const sourceLabels = {
      discord: 'Discord',
      mail: 'Mail',
      system: 'System',
      custom: 'Custom',
    };

    return (
      <>
        <section className="panel__section">
          <h3 className="panel__section-title">Notification Source</h3>
          <div className="panel__control-group">
            <label className="panel__control-label">Select Source</label>
            <div className="panel__options panel__options--column">
              {(Object.keys(sourceLabels) as Array<keyof typeof sourceLabels>).map((source) => (
                <label key={source} className="panel__option">
                  <input
                    type="radio"
                    name={`${widget.id}-source`}
                    checked={notifDraft.source === source}
                    onChange={() => handleNotifUpdate({ source })}
                  />
                  {sourceLabels[source]}
                  {source !== 'discord' && <span style={{ marginLeft: '8px', opacity: 0.5 }}>(Coming soon)</span>}
                </label>
              ))}
            </div>
          </div>
        </section>

        {notifDraft.source === 'discord' && (
          <>
            <section className="panel__section">
              <h3 className="panel__section-title">Discord Connection</h3>
              <div className="panel__control-group">
                {discordAuth?.isConnected ? (
                  <>
                    <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#4caf50', fontSize: '16px' }}>✓</span>
                        <span style={{ fontWeight: 500 }}>Connected as {discordAuth.user?.username}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="panel__button panel__button--ghost" 
                      onClick={handleDiscordDisconnect}
                      style={{ width: '100%' }}
                    >
                      Disconnect Discord
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255, 152, 0, 0.1)', borderRadius: '4px', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>
                        Connect your Discord account to see real DM notifications
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="panel__button panel__button--accent" 
                      onClick={handleDiscordConnect}
                      disabled={isConnecting}
                      style={{ width: '100%' }}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Discord'}
                    </button>
                  </>
                )}
              </div>
            </section>

            <section className="panel__section">
              <h3 className="panel__section-title">Discord DM Settings</h3>
              <div className="panel__control-group">
                <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>
                    <strong>DMs Only</strong> - This widget shows Discord Direct Messages only. Server messages and channels are not included.
                  </div>
                </div>
              </div>
            </section>

            <section className="panel__section">
              <h3 className="panel__section-title">Display</h3>
              <div className="panel__control-group">
                <label className="panel__control-label">Time Format</label>
                <div className="panel__options panel__options--column">
                  <label className="panel__option">
                    <input
                      type="radio"
                      name={`${widget.id}-time-format`}
                      checked={notifDraft.timeFormat === 'relative'}
                      onChange={() => handleNotifUpdate({ timeFormat: 'relative' })}
                    />
                    Relative (2m ago, 1h ago)
                  </label>
                  <label className="panel__option">
                    <input
                      type="radio"
                      name={`${widget.id}-time-format`}
                      checked={notifDraft.timeFormat === 'absolute'}
                      onChange={() => handleNotifUpdate({ timeFormat: 'absolute' })}
                    />
                    Absolute (3:45 PM)
                  </label>
                </div>
              </div>
            </section>

            <section className="panel__section">
              <h3 className="panel__section-title">Interaction</h3>
              <div className="panel__control-group">
                <label className="panel__control-label">On Click</label>
                <div className="panel__options panel__options--column">
                  <label className="panel__option">
                    <input
                      type="radio"
                      name={`${widget.id}-click`}
                      checked={notifDraft.openOnClick}
                      onChange={() => handleNotifUpdate({ openOnClick: true })}
                    />
                    Open Discord
                  </label>
                  <label className="panel__option">
                    <input
                      type="radio"
                      name={`${widget.id}-click`}
                      checked={!notifDraft.openOnClick}
                      onChange={() => handleNotifUpdate({ openOnClick: false })}
                    />
                    Do nothing
                  </label>
                </div>
              </div>
            </section>
          </>
        )}
      </>
    );
  };

  const renderContent = () => {
    if (widget.widgetType === 'clock') {
      return renderClockSettings();
    }
    if (widget.widgetType === 'notifications') {
      return renderNotificationSettings();
    }
    return <p className="panel__placeholder">Widget settings for "{widgetName}" coming soon...</p>;
  };

  const showActions = widget.widgetType === 'clock' || widget.widgetType === 'notifications';

  return (
    <div className="panel-overlay" onClick={handleCancel}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel__header">
          <h2 className="panel__title">{widgetName} Settings</h2>
          <button className="panel__close" onClick={handleCancel}>
            X
          </button>
        </div>
        <div className="panel__body">
          <div className="panel__content">{renderContent()}</div>
          {showActions && (
            <div className="panel__footer">
              <div className="panel__actions">
                <button className="panel__button panel__button--ghost" onClick={handleCancel} disabled={isSubmitting}>
                  Cancel
                </button>
                <button className="panel__button" onClick={handleApply} disabled={isSubmitting}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
