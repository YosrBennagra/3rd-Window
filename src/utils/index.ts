/**
 * Utilities Module
 * 
 * Collection of utility functions for performance monitoring, formatting,
 * and system-level helpers. Optimized for React and Zustand usage.
 * 
 * @module @utils
 * 
 * @example Performance Monitoring
 * ```typescript
 * import { useRenderTracking, trackIpcCall } from '@utils';
 * 
 * function MyComponent() {
 *   // Track component renders
 *   useRenderTracking('MyComponent');
 *   
 *   // Track IPC performance
 *   const data = await trackIpcCall('getMetrics', () => 
 *     IpcService.getSystemMetrics()
 *   );
 * }
 * ```
 * 
 * @example Formatting Utilities
 * ```typescript
 * import { formatBytes, formatPercent } from '@utils';
 * 
 * console.log(formatBytes(1024 * 1024)); // "1.00 MB"
 * console.log(formatPercent(0.856)); // "85.6%"
 * ```
 */

// Performance Utilities
export {
  createShallowSelector,
  createValueSelector,
  createActionSelector,
  usePerformanceMonitor,
} from './performance';

// Performance Monitoring
export {
  useRenderTracking,
  getRenderMetrics,
  resetRenderMetrics,
  trackIpcCall,
  getIpcMetrics,
  resetIpcMetrics,
  logPerformanceSummary,
} from './performanceMonitoring';

// System Utilities (re-exported from domain)
export {
  formatBytes,
  formatPercent,
  formatRelative,
  formatTemperature,
  formatNetworkSpeed,
} from './system';
