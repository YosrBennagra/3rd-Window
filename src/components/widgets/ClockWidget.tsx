import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { WidgetLayout } from '../../types/layout';
import type { ClockWidgetSettings } from '../../types/widgets';
import { ensureClockWidgetSettings } from '../../types/widgets';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  widget?: WidgetLayout;
}

const FONT_PRESETS: Record<Exclude<ClockWidgetSettings['fontSizeMode'], 'auto'>, { time: number; date: number }> = {
  small: { time: 28, date: 12 },
  medium: { time: 36, date: 14 },
  large: { time: 48, date: 18 },
};

const DEFAULT_CELL_PX = 72;
const MIN_INLINE_WIDTH_PX = 220;
const MIN_DATE_HEIGHT_PX = 120;
const MIN_DATE_WIDTH_PX = 180;
const MIN_SECONDS_HEIGHT_WITH_DATE_PX = 150;
const MIN_SECONDS_WIDTH_WITH_DATE_PX = 180;
const MIN_SECONDS_HEIGHT_PX = 90;
const MIN_SECONDS_WIDTH_PX = 140;
const MIN_TIME_ONLY_HEIGHT_PX = 70;
const MIN_TIME_FONT = 22;
const MAX_TIME_FONT = 96;
const MIN_DATE_FONT = 12;
const MAX_DATE_FONT = 32;
const ESTIMATED_CHAR_WIDTH = 0.55;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ClockWidget({ widget }: Props) {
  const [time, setTime] = useState(() => new Date());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const settings = ensureClockWidgetSettings(widget?.settings);
  const locale = useMemo(
    () => (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US'),
    [],
  );

  const widgetSize = {
    width: widget?.width ?? 4,
    height: widget?.height ?? 2,
  };

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const element = containerRef.current;
    if (!element) return;

    if (typeof ResizeObserver === 'undefined') {
      const updateSize = () => {
        const rect = element.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize((prev) => {
        if (Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5) {
          return prev;
        }
        return { width, height };
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const measuredWidth = containerSize.width || widgetSize.width * DEFAULT_CELL_PX;
  const measuredHeight = containerSize.height || widgetSize.height * DEFAULT_CELL_PX;

  const layoutPlan = useMemo(() => {
    let resolvedLayoutStyle = settings.layoutStyle;
    if (resolvedLayoutStyle === 'inline' && measuredWidth < MIN_INLINE_WIDTH_PX) {
      resolvedLayoutStyle = 'stacked';
    }

    const canShowDate = resolvedLayoutStyle !== 'minimal' && settings.dateFormat !== 'none';
    let showDate = canShowDate;
    if (showDate && (measuredHeight < MIN_DATE_HEIGHT_PX || measuredWidth < MIN_DATE_WIDTH_PX)) {
      showDate = false;
    }

    let showSeconds = settings.showSeconds;
    if (showSeconds) {
      const secondsHeightThreshold = showDate ? MIN_SECONDS_HEIGHT_WITH_DATE_PX : MIN_SECONDS_HEIGHT_PX;
      const secondsWidthThreshold = showDate ? MIN_SECONDS_WIDTH_WITH_DATE_PX : MIN_SECONDS_WIDTH_PX;
      if (measuredHeight < secondsHeightThreshold || measuredWidth < secondsWidthThreshold) {
        showSeconds = false;
      }
    }

    const widthScale = measuredWidth / (showDate ? 260 : 220);
    const heightScale = measuredHeight / (showDate ? 180 : 140);
    let scale = Math.min(widthScale, heightScale);
    scale = clamp(scale, 0.6, 2.4);

    if (!showDate && !showSeconds && measuredHeight < MIN_TIME_ONLY_HEIGHT_PX) {
      const reduction = Math.max(0.6, measuredHeight / MIN_TIME_ONLY_HEIGHT_PX);
      scale = clamp(scale * reduction, 0.5, 2.2);
    }

    const autoTime = 42 * scale;
    const autoDate = showDate ? 16 * Math.min(scale, 1.3) : undefined;
    const manual = settings.fontSizeMode === 'auto' ? null : FONT_PRESETS[settings.fontSizeMode];

    let timeFontSize = manual?.time ?? autoTime;
    let dateFontSize = showDate ? manual?.date ?? autoDate ?? autoTime * 0.35 : undefined;

    const maxTimeHeight = showDate ? measuredHeight * 0.55 : measuredHeight * 0.75;
    const maxDateHeight = measuredHeight * 0.3;
    const timeUpper = Math.min(MAX_TIME_FONT, maxTimeHeight);
    const dateUpper = Math.min(MAX_DATE_FONT, maxDateHeight);

    timeFontSize = clamp(timeFontSize, MIN_TIME_FONT, Math.max(MIN_TIME_FONT, timeUpper));

    const maxTimeWidth = measuredWidth * 0.9;
    const estimatedDigits = showSeconds ? 8 : 5;
    const estimatedTimeWidth = timeFontSize * ESTIMATED_CHAR_WIDTH * estimatedDigits;
    if (estimatedTimeWidth > maxTimeWidth) {
      const ratio = maxTimeWidth / estimatedTimeWidth;
      timeFontSize = clamp(timeFontSize * ratio, MIN_TIME_FONT, Math.max(MIN_TIME_FONT, timeUpper));
    }

    if (showDate && dateFontSize) {
      dateFontSize = clamp(dateFontSize, MIN_DATE_FONT, Math.max(MIN_DATE_FONT, dateUpper));
      const maxDateWidth = measuredWidth * 0.9;
      const estimatedDateWidth = dateFontSize * ESTIMATED_CHAR_WIDTH * 10;
      if (estimatedDateWidth > maxDateWidth) {
        const ratio = maxDateWidth / estimatedDateWidth;
        dateFontSize = clamp(dateFontSize * ratio, MIN_DATE_FONT, Math.max(MIN_DATE_FONT, dateUpper));
      }
    }

    return {
      resolvedLayoutStyle,
      showDate,
      showSeconds,
      timeFontSize,
      dateFontSize: showDate ? dateFontSize : undefined,
    };
  }, [
    measuredHeight,
    measuredWidth,
    settings.dateFormat,
    settings.fontSizeMode,
    settings.layoutStyle,
    settings.showSeconds,
  ]);

  const effectiveUpdateFrequency = layoutPlan.showSeconds ? settings.updateFrequency : 'minute';
  const intervalMs = effectiveUpdateFrequency === 'second' ? 1000 : 60000;
  const effectiveTimezone = settings.timezone === 'system' ? undefined : settings.timezone;

  useEffect(() => {
    setTime(new Date());
    const interval = window.setInterval(() => setTime(new Date()), intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs]);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: settings.timeFormat === '12h',
        timeZone: effectiveTimezone,
        ...(layoutPlan.showSeconds ? { second: '2-digit' } : {}),
      }),
    [effectiveTimezone, layoutPlan.showSeconds, locale, settings.timeFormat],
  );

  const dateFormatter = useMemo(() => {
    if (!layoutPlan.showDate) return null;
    const baseOptions: Intl.DateTimeFormatOptions =
      settings.dateFormat === 'short'
        ? { weekday: 'short', month: 'short', day: 'numeric' }
        : settings.dateFormat === 'medium'
          ? { weekday: 'long', month: 'short', day: 'numeric' }
          : { weekday: 'long', month: 'long', day: 'numeric', year: settings.dateFormat === 'long' ? 'numeric' : undefined };

    return new Intl.DateTimeFormat(locale, { ...baseOptions, timeZone: effectiveTimezone });
  }, [effectiveTimezone, layoutPlan.showDate, locale, settings.dateFormat]);

  const timeText = timeFormatter.format(time);
  const dateText = layoutPlan.showDate && dateFormatter ? dateFormatter.format(time) : null;
  const showTimezoneLabel = layoutPlan.showDate && settings.timezone !== 'system';

  const containerClasses = [
    'widget',
    'widget--medium',
    'clock-widget',
    `clock-widget--layout-${layoutPlan.resolvedLayoutStyle}`,
    `clock-widget--align-${settings.alignment}`,
    `clock-widget--font-${settings.fontSizeMode}`,
    !layoutPlan.showDate ? 'clock-widget--time-only' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const contentClass = `clock__body ${
    layoutPlan.resolvedLayoutStyle === 'inline' && layoutPlan.showDate ? 'clock__body--inline' : ''
  }`;

  const timeStyle = { fontSize: `${layoutPlan.timeFontSize}px`, lineHeight: 1 };
  const dateStyle = layoutPlan.dateFontSize ? { fontSize: `${layoutPlan.dateFontSize}px`, lineHeight: 1 } : undefined;

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
    <div className={containerClasses} ref={containerRef}>
      <div className="widget__content clock-widget__content" onClick={handleClick}>
        <div className={contentClass}>
          {layoutPlan.resolvedLayoutStyle === 'inline' && layoutPlan.showDate ? (
            <>
              <div className="clock__time" style={timeStyle}>
                {timeText}
              </div>
              <div className="clock__date clock__date--inline" style={dateStyle}>
                {dateText}
              </div>
            </>
          ) : (
            <>
              <div className="clock__time" style={timeStyle}>
                {timeText}
              </div>
              {layoutPlan.showDate && dateText && (
                <div className="clock__date" style={dateStyle}>
                  {dateText}
                </div>
              )}
            </>
          )}
        </div>
        {showTimezoneLabel && <div className="clock__timezone">{settings.timezone}</div>}
      </div>
    </div>
  );
}
