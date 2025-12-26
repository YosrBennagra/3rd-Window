/**
 * Performance Monitoring Utilities
 * 
 * Provides development-time monitoring for:
 * - Component render frequency
 * - IPC call tracking
 * - Performance metrics
 */

import { useEffect, useRef } from 'react';

interface RenderMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderInterval: number;
}

interface PerformanceMonitoringAPI {
  getRenderMetrics: () => RenderMetrics[];
  resetRenderMetrics: () => void;
  getIpcMetrics: () => IpcMetrics[];
  resetIpcMetrics: () => void;
  logPerformanceSummary: () => void;
}

// Augment Window interface for TypeScript
declare global {
  interface Window {
    performanceMonitoring?: PerformanceMonitoringAPI;
  }
}

// Global render tracking (dev mode only)
const renderMetrics = new Map<string, RenderMetrics>();

/**
 * Hook to track component render performance
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useRenderTracking('MyComponent');
 *   // ... rest of component
 * }
 * ```
 */
export function useRenderTracking(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderRef = useRef(Date.now());
  const renderIntervalsRef = useRef<number[]>([]);

  useEffect(() => {
    renderCountRef.current++;
    const now = Date.now();
    const interval = now - lastRenderRef.current;
    
    // Track last 10 intervals
    renderIntervalsRef.current.push(interval);
    if (renderIntervalsRef.current.length > 10) {
      renderIntervalsRef.current.shift();
    }

    const avgInterval = 
      renderIntervalsRef.current.reduce((a, b) => a + b, 0) / 
      renderIntervalsRef.current.length;

    renderMetrics.set(componentName, {
      componentName,
      renderCount: renderCountRef.current,
      lastRenderTime: now,
      averageRenderInterval: avgInterval,
    });

    // Log excessive renders
    if (renderCountRef.current % 10 === 0 && renderCountRef.current > 0) {
      console.warn(
        `[Performance] ${componentName} has rendered ${renderCountRef.current} times. ` +
        `Avg interval: ${avgInterval.toFixed(2)}ms`
      );
    }

    lastRenderRef.current = now;
  });
}

/**
 * Get all render metrics (for debugging)
 */
export function getRenderMetrics(): RenderMetrics[] {
  return Array.from(renderMetrics.values());
}

/**
 * Reset render tracking
 */
export function resetRenderMetrics() {
  renderMetrics.clear();
}

/**
 * IPC call tracking
 */
interface IpcMetrics {
  command: string;
  callCount: number;
  totalDuration: number;
  averageDuration: number;
  lastCallTime: number;
}

const ipcMetrics = new Map<string, IpcMetrics>();

/**
 * Track IPC call performance
 */
export function trackIpcCall(command: string, duration: number) {
  const existing = ipcMetrics.get(command);
  
  if (existing) {
    const newCallCount = existing.callCount + 1;
    const newTotalDuration = existing.totalDuration + duration;
    
    ipcMetrics.set(command, {
      command,
      callCount: newCallCount,
      totalDuration: newTotalDuration,
      averageDuration: newTotalDuration / newCallCount,
      lastCallTime: Date.now(),
    });
  } else {
    ipcMetrics.set(command, {
      command,
      callCount: 1,
      totalDuration: duration,
      averageDuration: duration,
      lastCallTime: Date.now(),
    });
  }
}

/**
 * Get IPC metrics
 */
export function getIpcMetrics(): IpcMetrics[] {
  return Array.from(ipcMetrics.values()).sort((a, b) => b.callCount - a.callCount);
}

/**
 * Reset IPC tracking
 */
export function resetIpcMetrics() {
  ipcMetrics.clear();
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary() {
  console.group('🎯 Performance Summary');
  
  // Render metrics
  console.group('📊 Render Metrics');
  const renders = getRenderMetrics();
  if (renders.length > 0) {
    console.table(renders.map(m => ({
      Component: m.componentName,
      Renders: m.renderCount,
      'Avg Interval (ms)': m.averageRenderInterval.toFixed(2),
    })));
  } else {
    console.log('No render tracking data');
  }
  console.groupEnd();
  
  // IPC metrics
  console.group('🔌 IPC Metrics');
  const ipc = getIpcMetrics();
  if (ipc.length > 0) {
    console.table(ipc.map(m => ({
      Command: m.command,
      Calls: m.callCount,
      'Total (ms)': m.totalDuration.toFixed(2),
      'Avg (ms)': m.averageDuration.toFixed(2),
    })));
  } else {
    console.log('No IPC tracking data');
  }
  console.groupEnd();
  
  console.groupEnd();
}

/**
 * Auto-log performance summary every 30 seconds in dev mode
 */
setInterval(() => {
  const hasData = renderMetrics.size > 0 || ipcMetrics.size > 0;
  if (hasData) {
    logPerformanceSummary();
  }
}, 30000);

// Expose to window for manual inspection
window.performanceMonitoring = {
  getRenderMetrics,
  resetRenderMetrics,
  getIpcMetrics,
  resetIpcMetrics,
  logPerformanceSummary,
};

