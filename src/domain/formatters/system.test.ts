/**
 * Unit Tests: System Formatters
 * 
 * Tests pure formatting functions in domain/formatters/system.ts
 */

import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatPercent,
  formatRelative,
  formatTemperature,
  formatNetworkSpeed,
} from '@domain/formatters/system';

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0.0 B');
    expect(formatBytes(512)).toBe('512.0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB');
  });

  it('formats megabytes correctly', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
  });

  it('formats terabytes correctly', () => {
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
    expect(formatBytes(1024 * 1024 * 1024 * 1024 * 3.2)).toBe('3.2 TB');
  });

  it('handles edge cases', () => {
    expect(formatBytes(Infinity)).toBe('0.0 B');
    expect(formatBytes(-Infinity)).toBe('0.0 B');
    expect(formatBytes(NaN)).toBe('0.0 B');
  });
});

describe('formatPercent', () => {
  it('formats percentages with one decimal', () => {
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(50)).toBe('50.0%');
    expect(formatPercent(100)).toBe('100.0%');
  });

  it('handles decimal values', () => {
    expect(formatPercent(33.333)).toBe('33.3%');
    expect(formatPercent(66.666)).toBe('66.7%');
    expect(formatPercent(99.999)).toBe('100.0%');
  });

  it('handles edge cases', () => {
    expect(formatPercent(0.1)).toBe('0.1%');
    expect(formatPercent(0.01)).toBe('0.0%');
  });
});

describe('formatRelative', () => {
  const NOW = 1704067200000; // 2024-01-01 00:00:00

  it('formats recent timestamps', () => {
    expect(formatRelative(NOW, NOW)).toBe('just now');
    expect(formatRelative(NOW - 30000, NOW)).toBe('just now'); // 30 seconds ago
    expect(formatRelative(NOW - 59999, NOW)).toBe('just now'); // 59.9 seconds ago
  });

  it('formats minutes', () => {
    expect(formatRelative(NOW - 60000, NOW)).toBe('1m ago'); // 1 minute
    expect(formatRelative(NOW - 300000, NOW)).toBe('5m ago'); // 5 minutes
    expect(formatRelative(NOW - 3599999, NOW)).toBe('59m ago'); // 59.9 minutes
  });

  it('formats hours', () => {
    expect(formatRelative(NOW - 3600000, NOW)).toBe('1h ago'); // 1 hour
    expect(formatRelative(NOW - 7200000, NOW)).toBe('2h ago'); // 2 hours
    expect(formatRelative(NOW - 86399999, NOW)).toBe('23h ago'); // 23.9 hours
  });

  it('formats days', () => {
    expect(formatRelative(NOW - 86400000, NOW)).toBe('1d ago'); // 1 day
    expect(formatRelative(NOW - 172800000, NOW)).toBe('2d ago'); // 2 days
    expect(formatRelative(NOW - 604800000, NOW)).toBe('7d ago'); // 7 days
  });
});

describe('formatTemperature', () => {
  it('formats Celsius by default', () => {
    expect(formatTemperature(0)).toBe('0.0°C');
    expect(formatTemperature(25)).toBe('25.0°C');
    expect(formatTemperature(100)).toBe('100.0°C');
  });

  it('formats Fahrenheit when specified', () => {
    expect(formatTemperature(0, 'F')).toBe('32.0°F');
    expect(formatTemperature(25, 'F')).toBe('77.0°F');
    expect(formatTemperature(100, 'F')).toBe('212.0°F');
  });

  it('handles negative temperatures', () => {
    expect(formatTemperature(-10)).toBe('-10.0°C');
    expect(formatTemperature(-10, 'F')).toBe('14.0°F');
  });

  it('handles decimal temperatures', () => {
    expect(formatTemperature(36.6)).toBe('36.6°C');
    expect(formatTemperature(36.6, 'F')).toBe('97.9°F');
  });
});

describe('formatNetworkSpeed', () => {
  it('formats bytes per second', () => {
    expect(formatNetworkSpeed(0)).toBe('0.0 B/s');
    expect(formatNetworkSpeed(512)).toBe('512.0 B/s');
    expect(formatNetworkSpeed(1024)).toBe('1.0 KB/s');
  });

  it('formats kilobytes per second', () => {
    expect(formatNetworkSpeed(1024 * 500)).toBe('500.0 KB/s');
    expect(formatNetworkSpeed(1024 * 1024)).toBe('1.0 MB/s');
  });

  it('formats megabytes per second', () => {
    expect(formatNetworkSpeed(1024 * 1024 * 10)).toBe('10.0 MB/s');
    expect(formatNetworkSpeed(1024 * 1024 * 1024)).toBe('1.0 GB/s');
  });

  it('handles edge cases', () => {
    expect(formatNetworkSpeed(Infinity)).toBe('0.0 B/s');
    expect(formatNetworkSpeed(-100)).toBe('0.0 B/s');
    expect(formatNetworkSpeed(NaN)).toBe('0.0 B/s');
  });
});
