/**
 * Tauri IPC Mocks
 * 
 * Mock implementations of Tauri commands for testing.
 * Provides deterministic, controllable IPC behavior.
 * 
 * Usage:
 * ```typescript
 * import { mockInvoke } from '@/test/mocks/tauri';
 * 
 * mockInvoke('get_monitors', [{ ... }]);
 * ```
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

// Re-export mocked invoke function
export const mockInvoke = vi.fn() as Mock;

// Mock Tauri API module
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

/**
 * Configure mock response for a specific command
 */
export function mockCommand<T>(command: string, response: T | Error) {
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === command) {
      if (response instanceof Error) {
        return Promise.reject(response);
      }
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`Unmocked command: ${cmd}`));
  });
}

/**
 * Configure multiple mock commands at once
 */
export function mockCommands(commands: Record<string, unknown | Error>) {
  mockInvoke.mockImplementation((cmd: string, args?: unknown) => {
    const key = args ? `${cmd}:${JSON.stringify(args)}` : cmd;
    if (key in commands) {
      const response = commands[key];
      if (response instanceof Error) {
        return Promise.reject(response);
      }
      return Promise.resolve(response);
    }
    if (cmd in commands) {
      const response = commands[cmd];
      if (response instanceof Error) {
        return Promise.reject(response);
      }
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`Unmocked command: ${cmd}`));
  });
}

/**
 * Reset all mock state
 */
export function resetMocks() {
  mockInvoke.mockReset();
}

/**
 * Common mock responses for testing
 */
export const mockMonitors = [
  {
    id: 'DISPLAY1',
    name: 'Primary Monitor',
    is_primary: true,
    position: { x: 0, y: 0 },
    size: { width: 1920, height: 1080 },
    scale_factor: 1.0,
  },
  {
    id: 'DISPLAY2',
    name: 'Secondary Monitor',
    is_primary: false,
    position: { x: 1920, y: 0 },
    size: { width: 1920, height: 1080 },
    scale_factor: 1.0,
  },
];

export const mockSettings = {
  fullscreen: false,
  selectedMonitor: 'DISPLAY1',
  theme: 'dark',
  powerSaving: false,
  refreshInterval: 8000,
};

export const mockSystemMetrics = {
  cpuUsage: 45.2,
  memoryUsage: 62.8,
  diskUsage: 75.1,
  networkUpload: 1024 * 100,
  networkDownload: 1024 * 500,
  cpuTempC: 55.0,
  gpuTempC: 60.0,
  fanSpeedRPM: 1500,
  timestamp: Date.now(),
};
