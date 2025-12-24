import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * Custom Hook: useSystemMetrics (React 18 Best Practice)
 * 
 * Encapsulates system metrics fetching behavior.
 * Follows React principles:
 * - Extracted logic from component (reusable)
 * - Proper effect cleanup
 * - Single responsibility
 * - No cross-layer leakage (uses IPC abstraction)
 */

export interface SystemMetrics {
  cpuUsage: number;
  cpuTemp: number;
  gpuTemp: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  netUpMbps: number;
  netDownMbps: number;
}

interface UseSystemMetricsOptions {
  /**
   * Polling interval in milliseconds
   * @default 2000
   */
  interval?: number;
  
  /**
   * Whether to start fetching immediately
   * @default true
   */
  enabled?: boolean;
}

export function useSystemMetrics(options: UseSystemMetricsOptions = {}) {
  const { interval = 2000, enabled = true } = options;
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    
    const fetchMetrics = async () => {
      try {
        const data = await invoke<SystemMetrics>('get_system_metrics');
        if (isMounted) {
          setMetrics(data);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useSystemMetrics] Failed to fetch:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    // Fetch immediately
    void fetchMetrics();
    
    // Then poll at interval
    const intervalId = setInterval(() => {
      void fetchMetrics();
    }, interval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [interval, enabled]);

  return { metrics, isLoading, error };
}
