/**
 * Vitest Global Test Setup
 * 
 * Configures test environment, mocks, and global utilities.
 * Runs once before all test suites.
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test (unmount React components)
afterEach(() => {
  cleanup();
});

// Mock Tauri API globally
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock Tauri event API
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(() => Promise.resolve()),
}));

// Mock console methods to reduce test noise (optional)
global.console = {
  ...console,
  // Uncomment to suppress console output in tests:
  // log: vi.fn(),
  // debug: vi.fn(),
  // warn: vi.fn(),
  error: console.error, // Keep errors visible
};

// Add custom matchers (optional)
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Extend Vitest's expect type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Vi {
    interface Assertion {
      toBeWithinRange(floor: number, ceiling: number): void;
    }
  }
}
