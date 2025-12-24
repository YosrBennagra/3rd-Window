/**
 * Domain Logic: System Formatters
 * 
 * Pure formatting functions extracted from utils.
 * Deterministic, testable, no side effects.
 */

/**
 * Format bytes into human-readable string
 * @pure
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes === 0) return '0.0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(1)} ${units[idx]}`;
}

/**
 * Format percentage with one decimal place
 * @pure
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format timestamp as relative time (e.g., "5m ago")
 * @pure - Pass Date.now() as parameter for testability
 */
export function formatRelative(timestamp: number, now: number = Date.now()): string {
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format temperature with unit
 * @pure
 */
export function formatTemperature(celsius: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'F') {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${fahrenheit.toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
}

/**
 * Format network speed (bytes/sec) into human-readable string
 * @pure
 */
export function formatNetworkSpeed(bytesPerSecond: number): string {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '0.0 B/s';
  const idx = Math.min(Math.floor(Math.log(bytesPerSecond) / Math.log(1024)), units.length - 1);
  const value = bytesPerSecond / Math.pow(1024, idx);
  return `${value.toFixed(1)} ${units[idx]}`;
}
