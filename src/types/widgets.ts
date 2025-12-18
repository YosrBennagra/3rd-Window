export type ClockTimeFormat = '12h' | '24h';
export type ClockDateFormat = 'none' | 'short' | 'medium' | 'long';
export type ClockLayoutStyle = 'stacked' | 'inline' | 'minimal';
export type ClockAlignment = 'left' | 'center' | 'right';
export type ClockFontSizeMode = 'auto' | 'small' | 'medium' | 'large';
export type ClockTimezone = 'system' | string;
export type ClockUpdateFrequency = 'second' | 'minute';
export type ClockClickBehavior = 'open-system-clock' | 'none';
export type ClockBackgroundStyle = 'glass' | 'solid' | 'transparent';

export interface ClockWidgetEffects {
  glow: boolean;
  shadow: boolean;
}

export interface ClockWidgetSettings {
  timeFormat: ClockTimeFormat;
  showSeconds: boolean;
  dateFormat: ClockDateFormat;
  layoutStyle: ClockLayoutStyle;
  alignment: ClockAlignment;
  fontSizeMode: ClockFontSizeMode;
  accentColor: string;
  backgroundStyle: ClockBackgroundStyle;
  effects: ClockWidgetEffects;
  timezone: ClockTimezone;
  updateFrequency: ClockUpdateFrequency;
  clickBehavior: ClockClickBehavior;
  minGridSize: { width: number; height: number };
  [key: string]: unknown;
}

export const CLOCK_WIDGET_DEFAULT_SETTINGS: ClockWidgetSettings = {
  timeFormat: '12h',
  showSeconds: true,
  dateFormat: 'long',
  layoutStyle: 'stacked',
  alignment: 'center',
  fontSizeMode: 'auto',
  accentColor: '#ffffff',
  backgroundStyle: 'glass',
  effects: { glow: false, shadow: true },
  timezone: 'system',
  updateFrequency: 'second',
  clickBehavior: 'open-system-clock',
  minGridSize: { width: 3, height: 2 },
};

const CLOCK_DATE_FORMATS: ClockDateFormat[] = ['none', 'short', 'medium', 'long'];
const CLOCK_LAYOUT_STYLES: ClockLayoutStyle[] = ['stacked', 'inline', 'minimal'];
const CLOCK_ALIGNMENTS: ClockAlignment[] = ['left', 'center', 'right'];
const CLOCK_FONT_SIZE_MODES: ClockFontSizeMode[] = ['auto', 'small', 'medium', 'large'];
const CLOCK_UPDATE_FREQUENCIES: ClockUpdateFrequency[] = ['second', 'minute'];
const CLOCK_CLICK_BEHAVIORS: ClockClickBehavior[] = ['open-system-clock', 'none'];
const CLOCK_BACKGROUND_STYLES: ClockBackgroundStyle[] = ['glass', 'solid', 'transparent'];

export function ensureClockWidgetSettings(settings?: unknown): ClockWidgetSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...CLOCK_WIDGET_DEFAULT_SETTINGS };
  }

  const candidate = settings as Partial<ClockWidgetSettings>;
  const merged: Record<string, unknown> = {
    ...CLOCK_WIDGET_DEFAULT_SETTINGS,
    ...(candidate as Record<string, unknown>),
  };

  merged.timeFormat = candidate.timeFormat === '24h' ? '24h' : '12h';
  merged.showSeconds = typeof candidate.showSeconds === 'boolean' ? candidate.showSeconds : CLOCK_WIDGET_DEFAULT_SETTINGS.showSeconds;
  merged.dateFormat = CLOCK_DATE_FORMATS.includes(candidate.dateFormat as ClockDateFormat)
    ? (candidate.dateFormat as ClockDateFormat)
    : CLOCK_WIDGET_DEFAULT_SETTINGS.dateFormat;
  merged.layoutStyle = CLOCK_LAYOUT_STYLES.includes(candidate.layoutStyle as ClockLayoutStyle)
    ? (candidate.layoutStyle as ClockLayoutStyle)
    : CLOCK_WIDGET_DEFAULT_SETTINGS.layoutStyle;
  merged.alignment = CLOCK_ALIGNMENTS.includes(candidate.alignment as ClockAlignment)
    ? (candidate.alignment as ClockAlignment)
    : CLOCK_WIDGET_DEFAULT_SETTINGS.alignment;
  merged.fontSizeMode = CLOCK_FONT_SIZE_MODES.includes(candidate.fontSizeMode as ClockFontSizeMode)
    ? (candidate.fontSizeMode as ClockFontSizeMode)
    : CLOCK_WIDGET_DEFAULT_SETTINGS.fontSizeMode;
  merged.accentColor =
    typeof candidate.accentColor === 'string' && candidate.accentColor.trim().length > 0
      ? candidate.accentColor
      : CLOCK_WIDGET_DEFAULT_SETTINGS.accentColor;
  merged.backgroundStyle = CLOCK_BACKGROUND_STYLES.includes(candidate.backgroundStyle as ClockBackgroundStyle)
    ? (candidate.backgroundStyle as ClockBackgroundStyle)
    : CLOCK_WIDGET_DEFAULT_SETTINGS.backgroundStyle;
  merged.effects = {
    glow:
      typeof candidate.effects === 'object' && candidate.effects !== null && typeof candidate.effects.glow === 'boolean'
        ? candidate.effects.glow
        : CLOCK_WIDGET_DEFAULT_SETTINGS.effects.glow,
    shadow:
      typeof candidate.effects === 'object' && candidate.effects !== null && typeof candidate.effects.shadow === 'boolean'
        ? candidate.effects.shadow
        : CLOCK_WIDGET_DEFAULT_SETTINGS.effects.shadow,
  };
  merged.timezone =
    typeof candidate.timezone === 'string' && candidate.timezone.trim().length > 0
      ? candidate.timezone
      : CLOCK_WIDGET_DEFAULT_SETTINGS.timezone;
  merged.updateFrequency = CLOCK_UPDATE_FREQUENCIES.includes(candidate.updateFrequency as ClockUpdateFrequency)
    ? (candidate.updateFrequency as ClockUpdateFrequency)
    : CLOCK_WIDGET_DEFAULT_SETTINGS.updateFrequency;
  merged.clickBehavior = CLOCK_CLICK_BEHAVIORS.includes(candidate.clickBehavior as ClockClickBehavior)
    ? (candidate.clickBehavior as ClockClickBehavior)
    : CLOCK_WIDGET_DEFAULT_SETTINGS.clickBehavior;
  merged.minGridSize =
    candidate.minGridSize &&
    typeof candidate.minGridSize === 'object' &&
    typeof (candidate.minGridSize as { width?: number }).width === 'number' &&
    typeof (candidate.minGridSize as { height?: number }).height === 'number'
      ? {
          width: Math.max(3, Math.floor((candidate.minGridSize as { width: number }).width)),
          height: Math.max(2, Math.floor((candidate.minGridSize as { height: number }).height)),
        }
      : { ...CLOCK_WIDGET_DEFAULT_SETTINGS.minGridSize };

  return merged as ClockWidgetSettings;
}

// Notification Widget Settings (Source-Based Architecture)
export type NotificationSource = 'discord' | 'mail' | 'system' | 'custom';
export type NotificationTimeFormat = 'relative' | 'absolute';

export interface NotificationWidgetSettings {
  source: NotificationSource;
  // Discord-specific settings
  showMentionsOnly: boolean;
  includeDMs: boolean;
  timeFormat: NotificationTimeFormat;
  openOnClick: boolean;
  // Future: Mail/System specific settings can be added here
  [key: string]: unknown;
}

export const NOTIFICATION_WIDGET_DEFAULT_SETTINGS: NotificationWidgetSettings = {
  source: 'discord',
  showMentionsOnly: false,
  includeDMs: true,
  timeFormat: 'relative',
  openOnClick: false,
};

export function ensureNotificationWidgetSettings(settings?: unknown): NotificationWidgetSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...NOTIFICATION_WIDGET_DEFAULT_SETTINGS };
  }

  const candidate = settings as Partial<NotificationWidgetSettings>;
  const merged: Record<string, unknown> = {
    ...NOTIFICATION_WIDGET_DEFAULT_SETTINGS,
    ...(candidate as Record<string, unknown>),
  };

  // Source selection
  const validSources: NotificationSource[] = ['discord', 'mail', 'system', 'custom'];
  merged.source = validSources.includes(candidate.source as NotificationSource)
    ? (candidate.source as NotificationSource)
    : NOTIFICATION_WIDGET_DEFAULT_SETTINGS.source;

  // Discord-specific settings
  merged.showMentionsOnly = typeof candidate.showMentionsOnly === 'boolean' 
    ? candidate.showMentionsOnly 
    : NOTIFICATION_WIDGET_DEFAULT_SETTINGS.showMentionsOnly;
  
  merged.includeDMs = typeof candidate.includeDMs === 'boolean'
    ? candidate.includeDMs
    : NOTIFICATION_WIDGET_DEFAULT_SETTINGS.includeDMs;
  
  merged.timeFormat = candidate.timeFormat === 'absolute' ? 'absolute' : 'relative';
  
  merged.openOnClick = typeof candidate.openOnClick === 'boolean'
    ? candidate.openOnClick
    : NOTIFICATION_WIDGET_DEFAULT_SETTINGS.openOnClick;

  return merged as NotificationWidgetSettings;
}

// Legacy Discord-only settings (for backward compatibility)
export type DiscordTimeFormat = NotificationTimeFormat;
export interface DiscordNotificationsSettings extends NotificationWidgetSettings {}
export const DISCORD_NOTIFICATIONS_DEFAULT_SETTINGS = NOTIFICATION_WIDGET_DEFAULT_SETTINGS;
export const ensureDiscordNotificationsSettings = ensureNotificationWidgetSettings;
