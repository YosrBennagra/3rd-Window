import { useMemo } from 'react';
import type { ClockWidgetSettings } from '../../domain/models/widgets';

/**
 * Custom Hook: useFormattedTime (React 18 Best Practice)
 * 
 * Encapsulates time formatting logic.
 * Follows React principles:
 * - Extracts complex formatting logic from component
 * - Memoizes formatters for performance
 * - Pure, testable function
 * - Single responsibility
 */

interface FormattedTime {
  timeText: string;
  dateText: string;
  hours: number;
  minutes: number;
}

export function useFormattedTime(
  time: Date,
  settings: ClockWidgetSettings
): FormattedTime {
  const locale = useMemo(
    () => (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US'),
    []
  );

  const effectiveTimezone = settings.timezone === 'system' ? undefined : settings.timezone;

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: effectiveTimezone,
      }),
    [effectiveTimezone, locale]
  );

  const zonedTime = useMemo(
    () => (effectiveTimezone ? new Date(time.toLocaleString('en-US', { timeZone: effectiveTimezone })) : time),
    [effectiveTimezone, time]
  );

  const hours24 = zonedTime.getHours();
  const minutes = zonedTime.getMinutes();
  const hours12 = hours24 % 12 || 12;
  const is24h = settings.timeFormat === '24h';

  const timeText = useMemo(() => {
    const hourText = is24h ? String(hours24).padStart(2, '0') : String(hours12);
    const minuteText = String(minutes).padStart(2, '0');
    const periodText = !is24h ? (hours24 >= 12 ? 'PM' : 'AM') : '';
    return is24h ? `${hourText}:${minuteText}` : `${hourText}:${minuteText} ${periodText}`;
  }, [hours24, hours12, minutes, is24h]);

  const dateText = useMemo(() => dateFormatter.format(zonedTime), [dateFormatter, zonedTime]);

  return {
    timeText,
    dateText,
    hours: is24h ? hours24 : hours12,
    minutes,
  };
}
