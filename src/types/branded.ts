/**
 * Branded Types for Type Safety
 * 
 * Branded types prevent accidental mixing of semantically different strings/numbers.
 * They provide compile-time guarantees without runtime overhead.
 * 
 * Example problem:
 * ```ts
 * const widgetId: string = "clock-1";
 * const ruleId: string = "rule-1";
 * deleteWidget(ruleId); // ❌ Wrong ID type, but TypeScript allows it
 * ```
 * 
 * With branded types:
 * ```ts
 * const widgetId: WidgetId = createWidgetId("clock-1");
 * const ruleId: AlertRuleId = createAlertRuleId("rule-1");
 * deleteWidget(ruleId); // ✅ TypeScript error: type mismatch
 * ```
 */

// ============================================================================
// BRAND TYPE UTILITY
// ============================================================================

/**
 * Brand a primitive type with a unique symbol
 * 
 * This creates a nominal type that TypeScript treats as distinct
 * from the base type, even though they're identical at runtime.
 */
type Brand<T, TBrand extends string> = T & { __brand: TBrand };

// ============================================================================
// WIDGET IDENTIFIERS
// ============================================================================

/**
 * Widget instance ID (e.g., "clock-abc123")
 * Uniquely identifies a widget instance on the grid
 */
export type WidgetInstanceId = Brand<string, 'WidgetInstanceId'>;

/**
 * Widget type ID (e.g., "clock", "timer", "notes")
 * Identifies the type/class of widget
 */
export type WidgetTypeId = Brand<string, 'WidgetTypeId'>;

/**
 * Create a typed widget instance ID
 */
export function createWidgetInstanceId(id: string): WidgetInstanceId {
  return id as WidgetInstanceId;
}

/**
 * Create a typed widget type ID
 */
export function createWidgetTypeId(type: string): WidgetTypeId {
  return type as WidgetTypeId;
}

/**
 * Check if a value is a valid widget ID format
 */
export function isValidWidgetId(value: unknown): value is WidgetInstanceId {
  return typeof value === 'string' && value.length > 0;
}

// ============================================================================
// ALERT IDENTIFIERS
// ============================================================================

/**
 * Alert rule ID (e.g., "high-cpu-rule")
 */
export type AlertRuleId = Brand<string, 'AlertRuleId'>;

/**
 * Alert instance ID (e.g., "high-cpu-1234567890")
 */
export type AlertInstanceId = Brand<string, 'AlertInstanceId'>;

/**
 * Create a typed alert rule ID
 */
export function createAlertRuleId(id: string): AlertRuleId {
  return id as AlertRuleId;
}

/**
 * Create a typed alert instance ID
 */
export function createAlertInstanceId(id: string): AlertInstanceId {
  return id as AlertInstanceId;
}

// ============================================================================
// MONITOR IDENTIFIERS
// ============================================================================

/**
 * Monitor ID (numeric monitor index)
 */
export type MonitorId = Brand<number, 'MonitorId'>;

/**
 * Create a typed monitor ID
 */
export function createMonitorId(id: number): MonitorId {
  if (!Number.isInteger(id) || id < 0) {
    throw new Error(`Invalid monitor ID: ${id}. Must be non-negative integer.`);
  }
  return id as MonitorId;
}

/**
 * Convert monitor ID back to number for APIs that need it
 */
export function monitorIdToNumber(id: MonitorId): number {
  return id as number;
}

// ============================================================================
// DURATION TYPES
// ============================================================================

/**
 * Duration in milliseconds
 * Prevents mixing seconds/milliseconds
 */
export type Milliseconds = Brand<number, 'Milliseconds'>;

/**
 * Duration in seconds
 */
export type Seconds = Brand<number, 'Seconds'>;

/**
 * Create milliseconds duration
 */
export function milliseconds(value: number): Milliseconds {
  return value as Milliseconds;
}

/**
 * Create seconds duration
 */
export function seconds(value: number): Seconds {
  return value as Seconds;
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMillis(s: Seconds): Milliseconds {
  return (s * 1000) as Milliseconds;
}

/**
 * Convert milliseconds to seconds
 */
export function millisToSeconds(ms: Milliseconds): Seconds {
  return (ms / 1000) as Seconds;
}

// ============================================================================
// FILE PATH TYPES
// ============================================================================

/**
 * Absolute file path
 * Distinguishes from relative paths or URLs
 */
export type AbsolutePath = Brand<string, 'AbsolutePath'>;

/**
 * HTTP/HTTPS URL
 */
export type HttpUrl = Brand<string, 'HttpUrl'>;

/**
 * Create absolute path (basic validation)
 */
export function createAbsolutePath(path: string): AbsolutePath {
  // Windows: C:\path or \\network\path
  // Unix: /path
  const isAbsolute = /^([A-Za-z]:|\\\\|\/)/i.test(path);
  if (!isAbsolute) {
    throw new Error(`Not an absolute path: ${path}`);
  }
  return path as AbsolutePath;
}

/**
 * Create HTTP URL (basic validation)
 */
export function createHttpUrl(url: string): HttpUrl {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`Not an HTTP(S) URL: ${url}`);
  }
  return url as HttpUrl;
}

// ============================================================================
// PERCENTAGE TYPES
// ============================================================================

/**
 * Percentage value (0-100)
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Create percentage with validation
 */
export function percentage(value: number): Percentage {
  if (value < 0 || value > 100) {
    throw new Error(`Invalid percentage: ${value}. Must be 0-100.`);
  }
  return value as Percentage;
}

/**
 * Convert ratio (0-1) to percentage (0-100)
 */
export function ratioToPercentage(ratio: number): Percentage {
  return percentage(ratio * 100);
}

/**
 * Convert percentage (0-100) to ratio (0-1)
 */
export function percentageToRatio(pct: Percentage): number {
  return (pct as number) / 100;
}
