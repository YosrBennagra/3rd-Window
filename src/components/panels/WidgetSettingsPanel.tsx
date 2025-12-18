import { useEffect, useMemo, useState } from 'react';
import type { WidgetLayout } from '../../types/layout';
import type { ClockWidgetSettings } from '../../types/widgets';
import { ensureClockWidgetSettings } from '../../types/widgets';
import './Panel.css';

const widgetNames: Record<string, string> = {
  clock: 'Clock',
  'cpu-temp': 'CPU Temperature',
  'gpu-temp': 'GPU Temperature',
  notifications: 'Notifications',
};

interface Props {
  widget: WidgetLayout;
  previewSettings?: ClockWidgetSettings;
  onPreviewChange: (settings: ClockWidgetSettings) => void;
  onApply: (settings: ClockWidgetSettings) => Promise<void> | void;
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

  const renderContent = () => {
    if (widget.widgetType === 'clock') {
      return renderClockSettings();
    }
    return <p className="panel__placeholder">Widget settings for "{widgetName}" coming soon...</p>;
  };

  const showActions = widget.widgetType === 'clock';

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
