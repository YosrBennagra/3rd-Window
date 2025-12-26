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

// Timer Widget Settings
export interface TimerWidgetSettings {
  durationMinutes: number;
  durationSeconds: number;
  label: string;
  showLabel: boolean;
  [key: string]: unknown;
}

export const TIMER_WIDGET_DEFAULT_SETTINGS: TimerWidgetSettings = {
  durationMinutes: 25,
  durationSeconds: 0,
  label: 'Focus',
  showLabel: true,
};

export function ensureTimerWidgetSettings(settings?: unknown): TimerWidgetSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...TIMER_WIDGET_DEFAULT_SETTINGS };
  }
  const candidate = settings as Partial<TimerWidgetSettings>;
  return {
    durationMinutes: typeof candidate.durationMinutes === 'number' ? candidate.durationMinutes : TIMER_WIDGET_DEFAULT_SETTINGS.durationMinutes,
    durationSeconds: typeof candidate.durationSeconds === 'number' ? candidate.durationSeconds : TIMER_WIDGET_DEFAULT_SETTINGS.durationSeconds,
    label: typeof candidate.label === 'string' ? candidate.label : TIMER_WIDGET_DEFAULT_SETTINGS.label,
    showLabel: typeof candidate.showLabel === 'boolean' ? candidate.showLabel : TIMER_WIDGET_DEFAULT_SETTINGS.showLabel,
  };
}

// Image Widget Settings
export type ImageObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

export interface ImageWidgetSettings {
  imagePath: string | null;
  objectFit: ImageObjectFit;
  opacity: number;
  [key: string]: unknown;
}

export const IMAGE_WIDGET_DEFAULT_SETTINGS: ImageWidgetSettings = {
  imagePath: null,
  objectFit: 'contain',
  opacity: 1,
};

export function ensureImageWidgetSettings(settings?: unknown): ImageWidgetSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...IMAGE_WIDGET_DEFAULT_SETTINGS };
  }
  const candidate = settings as Partial<ImageWidgetSettings>;
  const validObjectFits: ImageObjectFit[] = ['contain', 'cover', 'fill', 'none', 'scale-down'];
  return {
    imagePath: typeof candidate.imagePath === 'string' ? candidate.imagePath : IMAGE_WIDGET_DEFAULT_SETTINGS.imagePath,
    objectFit: validObjectFits.includes(candidate.objectFit as ImageObjectFit) 
      ? (candidate.objectFit as ImageObjectFit) 
      : IMAGE_WIDGET_DEFAULT_SETTINGS.objectFit,
    opacity: typeof candidate.opacity === 'number' && candidate.opacity >= 0 && candidate.opacity <= 1 
      ? candidate.opacity 
      : IMAGE_WIDGET_DEFAULT_SETTINGS.opacity,
  };
}

// Video Widget Settings
export type VideoObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

export interface VideoWidgetSettings {
  videoPath: string | null;
  objectFit: VideoObjectFit;
  autoPlay: boolean;
  loop: boolean;
  muted: boolean;
  [key: string]: unknown;
}

export const VIDEO_WIDGET_DEFAULT_SETTINGS: VideoWidgetSettings = {
  videoPath: null,
  objectFit: 'contain',
  autoPlay: false,
  loop: false,
  muted: true,
};

export function ensureVideoWidgetSettings(settings?: unknown): VideoWidgetSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...VIDEO_WIDGET_DEFAULT_SETTINGS };
  }
  const candidate = settings as Partial<VideoWidgetSettings>;
  const validObjectFits: VideoObjectFit[] = ['contain', 'cover', 'fill', 'none', 'scale-down'];
  return {
    videoPath: typeof candidate.videoPath === 'string' ? candidate.videoPath : VIDEO_WIDGET_DEFAULT_SETTINGS.videoPath,
    objectFit: validObjectFits.includes(candidate.objectFit as VideoObjectFit) 
      ? (candidate.objectFit as VideoObjectFit) 
      : VIDEO_WIDGET_DEFAULT_SETTINGS.objectFit,
    autoPlay: typeof candidate.autoPlay === 'boolean' ? candidate.autoPlay : VIDEO_WIDGET_DEFAULT_SETTINGS.autoPlay,
    loop: typeof candidate.loop === 'boolean' ? candidate.loop : VIDEO_WIDGET_DEFAULT_SETTINGS.loop,
    muted: typeof candidate.muted === 'boolean' ? candidate.muted : VIDEO_WIDGET_DEFAULT_SETTINGS.muted,
  };
}

// Notes Widget Settings
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NotesWidgetSettings {
  mode: 'notes' | 'todos';
  noteText: string;
  todos: TodoItem[];
  fontSize: number;
  [key: string]: unknown;
}

export const NOTES_WIDGET_DEFAULT_SETTINGS: NotesWidgetSettings = {
  mode: 'notes',
  noteText: '',
  todos: [],
  fontSize: 14,
};

export function ensureNotesWidgetSettings(settings?: unknown): NotesWidgetSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...NOTES_WIDGET_DEFAULT_SETTINGS };
  }
  const candidate = settings as Partial<NotesWidgetSettings>;
  
  // Validate todos array
  let validTodos: TodoItem[] = NOTES_WIDGET_DEFAULT_SETTINGS.todos;
  if (Array.isArray(candidate.todos)) {
    validTodos = candidate.todos.filter((item): item is TodoItem => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.text === 'string' &&
        typeof item.completed === 'boolean'
      );
    });
  }
  
  return {
    mode: (candidate.mode === 'notes' || candidate.mode === 'todos') 
      ? candidate.mode 
      : NOTES_WIDGET_DEFAULT_SETTINGS.mode,
    noteText: typeof candidate.noteText === 'string' 
      ? candidate.noteText 
      : NOTES_WIDGET_DEFAULT_SETTINGS.noteText,
    todos: validTodos,
    fontSize: typeof candidate.fontSize === 'number' && candidate.fontSize > 0 
      ? candidate.fontSize 
      : NOTES_WIDGET_DEFAULT_SETTINGS.fontSize,
  };
}

// Quick Links Widget Settings
export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface QuickLinksWidgetSettings {
  links: QuickLink[];
  gridColumns: number;
  [key: string]: unknown;
}

export const QUICKLINKS_WIDGET_DEFAULT_SETTINGS: QuickLinksWidgetSettings = {
  links: [],
  gridColumns: 2,
};

export function ensureQuickLinksWidgetSettings(settings?: unknown): QuickLinksWidgetSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...QUICKLINKS_WIDGET_DEFAULT_SETTINGS };
  }
  const candidate = settings as Partial<QuickLinksWidgetSettings>;
  
  // Validate links array
  let validLinks: QuickLink[] = QUICKLINKS_WIDGET_DEFAULT_SETTINGS.links;
  if (Array.isArray(candidate.links)) {
    validLinks = candidate.links.filter((item): item is QuickLink => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.url === 'string'
      );
    });
  }
  
  return {
    links: validLinks,
    gridColumns: typeof candidate.gridColumns === 'number' && candidate.gridColumns > 0 && candidate.gridColumns <= 4
      ? candidate.gridColumns 
      : QUICKLINKS_WIDGET_DEFAULT_SETTINGS.gridColumns,
  };
}

// PDF Widget Settings
export interface PDFWidgetSettings {
  pdfPath: string | null;
  zoom: number;
  currentPage: number;
  [key: string]: unknown;
}

export const PDF_WIDGET_DEFAULT_SETTINGS: PDFWidgetSettings = {
  pdfPath: null,
  zoom: 1,
  currentPage: 1,
};

export function ensurePDFWidgetSettings(settings?: unknown): PDFWidgetSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...PDF_WIDGET_DEFAULT_SETTINGS };
  }
  const candidate = settings as Partial<PDFWidgetSettings>;
  return {
    pdfPath: typeof candidate.pdfPath === 'string' ? candidate.pdfPath : PDF_WIDGET_DEFAULT_SETTINGS.pdfPath,
    zoom: typeof candidate.zoom === 'number' && candidate.zoom >= 0.5 && candidate.zoom <= 3
      ? candidate.zoom
      : PDF_WIDGET_DEFAULT_SETTINGS.zoom,
    currentPage: typeof candidate.currentPage === 'number' && candidate.currentPage > 0
      ? candidate.currentPage
      : PDF_WIDGET_DEFAULT_SETTINGS.currentPage,
  };
}

// Network Monitor Widget
export interface NetworkMonitorWidgetSettings {
  refreshInterval: number;
  showDownload: boolean;
  showUpload: boolean;
  showTotals: boolean;
  showBars: boolean;
  showInterface: boolean;
  [key: string]: unknown;
}

export const NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS: NetworkMonitorWidgetSettings = {
  refreshInterval: 1000, // 1 second
  showDownload: true,
  showUpload: true,
  showTotals: true,
  showBars: true,
  showInterface: true,
};

export function ensureNetworkMonitorWidgetSettings(settings?: unknown): NetworkMonitorWidgetSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS };
  }

  const candidate = settings as Partial<NetworkMonitorWidgetSettings>;
  return {
    ...NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS,
    ...(candidate as Record<string, unknown>),
    refreshInterval: typeof candidate.refreshInterval === 'number' && candidate.refreshInterval >= 500
      ? candidate.refreshInterval
      : NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS.refreshInterval,
    showDownload: typeof candidate.showDownload === 'boolean'
      ? candidate.showDownload
      : NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS.showDownload,
    showUpload: typeof candidate.showUpload === 'boolean'
      ? candidate.showUpload
      : NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS.showUpload,
    showTotals: typeof candidate.showTotals === 'boolean'
      ? candidate.showTotals
      : NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS.showTotals,
    showBars: typeof candidate.showBars === 'boolean'
      ? candidate.showBars
      : NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS.showBars,
    showInterface: typeof candidate.showInterface === 'boolean'
      ? candidate.showInterface
      : NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS.showInterface,
  };
}

// Widget definition for the config-driven widget system
export interface WidgetDefinition {
  id: string;
  title: string;
  component: string;
  defaultSize: { w: number; h: number };
  description?: string;
  disabled?: boolean;
}

// Re-export future types for backward compatibility
export type {
  AlertItem,
  MetricSnapshot,
  NotificationItem,
  IntegrationStatus,
  PipelineStatus,
  ShortcutItem,
} from './future';
