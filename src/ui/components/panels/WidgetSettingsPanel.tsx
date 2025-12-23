import { useEffect, useMemo, useState } from 'react';
import type { WidgetLayout } from '../../../domain/models/layout';
import type { ClockWidgetSettings, TimerWidgetSettings } from '../../../domain/models/widgets';
import { ensureClockWidgetSettings, ensureTimerWidgetSettings } from '../../../domain/models/widgets';
import './Panel.css';

const widgetNames: Record<string, string> = {
  clock: 'Clock',
  timer: 'Timer',
};

interface Props {
  widget: WidgetLayout;
  previewSettings?: ClockWidgetSettings | TimerWidgetSettings;
  onPreviewChange: (settings: ClockWidgetSettings | TimerWidgetSettings) => void;
  onApply: (settings: ClockWidgetSettings | TimerWidgetSettings) => Promise<void> | void;
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

export default function WidgetSettingsPanel({ widget, previewSettings, onPreviewChange, onApply, onCancel }: Props) {
  const widgetName = widgetNames[widget.widgetType] || widget.widgetType;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clock State
  const clockBaseSettings = useMemo(
    () => (widget.widgetType === 'clock' ? ensureClockWidgetSettings(previewSettings ?? widget.settings) : null),
    [previewSettings, widget],
  );
  const [clockDraft, setClockDraft] = useState<ClockWidgetSettings | null>(clockBaseSettings);
  const [timezoneInput, setTimezoneInput] = useState('');

  // Timer State
  const timerBaseSettings = useMemo(
    () => (widget.widgetType === 'timer' ? ensureTimerWidgetSettings(previewSettings ?? widget.settings) : null),
    [previewSettings, widget],
  );
  const [timerDraft, setTimerDraft] = useState<TimerWidgetSettings | null>(timerBaseSettings);

  useEffect(() => {
    if (widget.widgetType === 'clock' && clockBaseSettings) {
      setClockDraft(clockBaseSettings);
      setTimezoneInput(clockBaseSettings.timezone === 'system' ? '' : clockBaseSettings.timezone);
    } else if (widget.widgetType === 'timer' && timerBaseSettings) {
      setTimerDraft(timerBaseSettings);
    }
  }, [widget.widgetType, clockBaseSettings, timerBaseSettings]);

  const handleClockUpdate = (partial: Partial<ClockWidgetSettings>) => {
    if (!clockDraft) return;
    const next = ensureClockWidgetSettings({ ...clockDraft, ...partial });
    setClockDraft(next);
    onPreviewChange(next);
  };

  const handleTimerUpdate = (partial: Partial<TimerWidgetSettings>) => {
    if (!timerDraft) return;
    const next = ensureTimerWidgetSettings({ ...timerDraft, ...partial });
    setTimerDraft(next);
    onPreviewChange(next);
  };

  const handleTimezoneInput = (value: string) => {
    setTimezoneInput(value);
    handleClockUpdate({ timezone: value.trim() === '' ? 'system' : value.trim() });
  };

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      if (widget.widgetType === 'clock' && clockDraft) {
        await onApply(clockDraft);
      } else if (widget.widgetType === 'timer' && timerDraft) {
        await onApply(timerDraft);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const renderClockSettings = () => {
    if (!clockDraft) return null;
    return (
      <>
        <section className="panel__section">
          <h3 className="panel__section-title">Appearance</h3>
          <div className="panel__control-group">
            <label className="panel__control-label">Layout Style</label>
            <div className="panel__options">
              {(Object.keys(layoutStyleLabels) as ClockWidgetSettings['layoutStyle'][]).map((style) => (
                <label key={style} className="panel__option">
                  <input
                    type="radio"
                    name={`${widget.id}-layout`}
                    checked={clockDraft.layoutStyle === style}
                    onChange={() => handleClockUpdate({ layoutStyle: style })}
                  />
                  {layoutStyleLabels[style]}
                </label>
              ))}
            </div>
          </div>

          <div className="panel__control-group">
            <label className="panel__control-label">Alignment</label>
            <div className="panel__options">
              {(Object.keys(alignmentLabels) as ClockWidgetSettings['alignment'][]).map((align) => (
                <label key={align} className="panel__option">
                  <input
                    type="radio"
                    name={`${widget.id}-align`}
                    checked={clockDraft.alignment === align}
                    onChange={() => handleClockUpdate({ alignment: align })}
                  />
                  {alignmentLabels[align]}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="panel__section">
          <h3 className="panel__section-title">Date & Time</h3>
          <div className="panel__control-group">
            <label className="panel__control-label">Date Format</label>
            <select
              className="panel__select"
              value={clockDraft.dateFormat}
              onChange={(e) => handleClockUpdate({ dateFormat: e.target.value as ClockWidgetSettings['dateFormat'] })}
            >
              {(Object.keys(dateFormatLabels) as ClockWidgetSettings['dateFormat'][]).map((format) => (
                <option key={format} value={format}>
                  {dateFormatLabels[format]}
                </option>
              ))}
            </select>
          </div>

          <div className="panel__control-group">
            <label className="panel__control-label">Time Format</label>
            <div className="panel__options">
              <label className="panel__option">
                <input
                  type="radio"
                  name={`${widget.id}-format`}
                  checked={clockDraft.timeFormat === '12h'}
                  onChange={() => handleClockUpdate({ timeFormat: '12h' })}
                />
                12-hour
              </label>
              <label className="panel__option">
                <input
                  type="radio"
                  name={`${widget.id}-format`}
                  checked={clockDraft.timeFormat === '24h'}
                  onChange={() => handleClockUpdate({ timeFormat: '24h' })}
                />
                24-hour
              </label>
            </div>
          </div>

          <div className="panel__control-group">
            <label className="panel__control-label">Seconds</label>
            <label className="panel__toggle">
              <input
                type="checkbox"
                checked={clockDraft.showSeconds}
                onChange={(e) => handleClockUpdate({ showSeconds: e.target.checked })}
              />
              Show seconds
            </label>
          </div>

          <div className="panel__control-group">
            <label className="panel__control-label">Timezone</label>
            <input
              type="text"
              className="panel__input"
              placeholder="System Default (leave empty)"
              value={timezoneInput}
              onChange={(e) => handleTimezoneInput(e.target.value)}
            />
            <p className="panel__help-text">e.g., "America/New_York", "UTC", "Asia/Tokyo"</p>
          </div>
        </section>
      </>
    );
  };

  const renderTimerSettings = () => {
    if (!timerDraft) return null;
    return (
      <>
        <section className="panel__section">
          <h3 className="panel__section-title">Duration</h3>
          <div className="panel__control-group">
            <label className="panel__control-label">Minutes</label>
            <input
              type="number"
              className="panel__input"
              min="0"
              max="180"
              value={timerDraft.durationMinutes}
              onChange={(e) => handleTimerUpdate({ durationMinutes: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="panel__control-group">
            <label className="panel__control-label">Seconds</label>
            <input
              type="number"
              className="panel__input"
              min="0"
              max="59"
              value={timerDraft.durationSeconds}
              onChange={(e) => handleTimerUpdate({ durationSeconds: parseInt(e.target.value) || 0 })}
            />
          </div>
        </section>

        <section className="panel__section">
          <h3 className="panel__section-title">Label</h3>
          <div className="panel__control-group">
            <label className="panel__control-label">Text</label>
            <input
              type="text"
              className="panel__input"
              value={timerDraft.label}
              onChange={(e) => handleTimerUpdate({ label: e.target.value })}
            />
          </div>
          <div className="panel__control-group">
            <label className="panel__toggle">
              <input
                type="checkbox"
                checked={timerDraft.showLabel}
                onChange={(e) => handleTimerUpdate({ showLabel: e.target.checked })}
              />
              Show Label
            </label>
          </div>
        </section>
      </>
    );
  };

  const renderContent = () => {
    if (widget.widgetType === 'clock') {
      return renderClockSettings();
    }
    if (widget.widgetType === 'timer') {
      return renderTimerSettings();
    }
    return <p className="panel__placeholder">Widget settings for "{widgetName}" coming soon...</p>;
  };

  const showActions = widget.widgetType === 'clock' || widget.widgetType === 'timer';

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
