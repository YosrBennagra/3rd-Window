/**
 * Test Helper Utilities
 * 
 * Common utilities for writing tests across the codebase.
 * Includes time helpers, data generators, and assertion utilities.
 */

import { vi, beforeEach, afterEach } from 'vitest';

/**
 * Mock Date.now() to return a fixed timestamp
 */
export function mockTime(timestamp: number) {
  vi.spyOn(Date, 'now').mockReturnValue(timestamp);
}

/**
 * Reset time mocks
 */
export function resetTime() {
  vi.restoreAllMocks();
}

/**
 * Create a deterministic random number generator
 */
export function createSeededRandom(seed: number) {
  let current = seed;
  return () => {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

/**
 * Wait for a condition to become true (with timeout)
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Create mock system metrics for testing
 */
export function createMockMetrics(overrides: Partial<{
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  cpuTempC: number;
  gpuTempC: number;
}> = {}) {
  return {
    cpu: 50,
    memory: 50,
    disk: 50,
    network: { up: 0, down: 0 },
    temperature: { cpu: 55, gpu: 60 },
    cpuUsage: 50,
    cpuTemp: 55,
    cpuTempC: 55,
    gpuTemp: 60,
    gpuTempC: 60,
    ramUsedBytes: 8589934592, // 8GB
    ramTotalBytes: 17179869184, // 16GB
    diskUsedBytes: 536870912000, // 500GB
    diskTotalBytes: 1073741824000, // 1TB
    netDownMbps: 10,
    netUpMbps: 5,
    fanSpeedRPM: 1500,
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Create mock widget layout for testing
 */
export function createMockWidget(overrides: Partial<{
  id: string;
  widgetType: string;
  x: number;
  y: number;
  width: number;
  height: number;
}> = {}) {
  return {
    id: 'test-widget-1',
    widgetType: 'clock',
    x: 0,
    y: 0,
    width: 4,
    height: 3,
    settings: {},
    ...overrides,
  };
}

/**
 * Suppress console warnings during tests
 */
export function suppressConsoleWarnings() {
  const originalWarn = console.warn;
  beforeEach(() => {
    console.warn = vi.fn();
  });
  afterEach(() => {
    console.warn = originalWarn;
  });
}
