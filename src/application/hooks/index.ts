/**
 * Application Hooks - Barrel Export
 * 
 * Centralized exports for all React hooks used at the application layer.
 * These hooks provide reusable stateful logic for components.
 * 
 * @module application/hooks
 * @example
 * ```typescript
 * import { useSystemMetrics, useClock, useContextMenu } from '@application/hooks';
 * 
 * function MyComponent() {
 *   // Get system metrics with performance optimization
 *   const { metrics, error, isLoading } = useSystemMetrics({ refreshInterval: 2000 });
 *   
 *   // Get current time
 *   const currentTime = useClock();
 *   
 *   // Context menu handling
 *   const { show, hide, position } = useContextMenu();
 * }
 * ```
 */

// Time and Clock Hooks
/**
 * Hook for real-time clock with automatic updates.
 * @returns Current time updated every second
 */
export { useClock } from './useClock';

/**
 * Hook for formatted time display with customizable format.
 * @returns Formatted time string
 */
export { useFormattedTime } from './useFormattedTime';

// Context Menu Hook
/**
 * Hook for managing context menu state and positioning.
 * @returns Context menu controls
 */
export { useContextMenu } from './useContextMenu';

// System Metrics Hooks (Performance Optimized)
/**
 * Performance-optimized hooks for system metrics.
 * Features visibility detection, caching, and configurable polling.
 * 
 * @see {@link UseSystemMetricsOptions} for configuration options
 */
export { 
  /** Fetch system metrics (CPU, RAM, disk, network) with optimization */
  useSystemMetrics, 
  /** Fetch network statistics with performance tracking */
  useNetworkStats, 
  /** Fetch system temperatures (CPU/GPU) with slower polling */
  useSystemTemperatures 
} from './useSystemMetrics';

/**
 * Options for system metrics hooks.
 * Allows fine-tuning of polling behavior and performance.
 */
export type { UseSystemMetricsOptions } from './useSystemMetrics';

// System Temperature Hooks
export { useSystemTemps } from './useSystemTemps';
export { useTemperatureColor } from './useTemperatureColor';
