import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import type { WidgetLayout } from '../../types/layout';
import { ensureClockWidgetSettings } from '../../types/widgets';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  widget?: WidgetLayout;
}

export function ClockWidget({ widget }: Props) {
  const [time, setTime] = useState(() => new Date());
  const settings = ensureClockWidgetSettings(widget?.settings);
  const locale = useMemo(
    () => (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US'),
    [],
  );

  const intervalMs = 60000;
  const effectiveTimezone = settings.timezone === 'system' ? undefined : settings.timezone;

  useEffect(() => {
    setTime(new Date());
    const interval = window.setInterval(() => setTime(new Date()), intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: effectiveTimezone,
      }),
    [effectiveTimezone, locale],
  );

  const zonedTime = useMemo(
    () => (effectiveTimezone ? new Date(time.toLocaleString('en-US', { timeZone: effectiveTimezone })) : time),
    [effectiveTimezone, time],
  );

  const hours24 = zonedTime.getHours();
  const minutes = zonedTime.getMinutes();
  const hours12 = hours24 % 12 || 12;
  const is24h = settings.timeFormat === '24h';
  const hourText = is24h ? String(hours24).padStart(2, '0') : String(hours12);
  const minuteText = String(minutes).padStart(2, '0');
  const periodText = !is24h ? (hours24 >= 12 ? 'PM' : 'AM') : '';
  const timeText = is24h ? `${hourText}:${minuteText}` : `${hourText}:${minuteText} ${periodText}`;
  const dateText = dateFormatter.format(zonedTime);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (settings.clickBehavior !== 'open-system-clock') return;
      void invoke('open_system_clock').catch(() => {
        if (typeof window !== 'undefined') {
          window.open('ms-clock:', '_blank');
        }
      });
    },
    [settings.clickBehavior],
  );

  return (
    <div className="widget clock-widget clock-widget--static">
      <div className="widget__content clock-widget__content" onClick={handleClick}>
        <div className="clock-static">
          <div className="clock-static__time">{timeText}</div>
          <div className="clock-static__date">{dateText}</div>
        </div>
      </div>
    </div>
  );
}
