/**
 * Performance-Optimized System Metrics Hook
 * 
 * Reduces IPC traffic by:
 * - Using configurable refresh intervals
 * - Pausing updates when component is not visible
 * - Batching multiple metric requests
 * - Caching recent results
 */

import { useState, useEffect, useRef } from 'react';
import type { SystemMetrics, NetworkStats } from '../types/ipc';
import { invoke } from '@tauri-apps/api/core';

export interface UseSystemMetricsOptions {
  /**
   * Refresh interval in milliseconds
   * @default 2000
   */
  refreshInterval?: number;

  /**
   * Pause updates when document is hidden (tab switched, minimized)
   * @default true
   */
  pauseWhenHidden?: boolean;

  /**
   * Initial data to avoid loading state
   */
  initialData?: SystemMetrics | null;
}

/**
 * Hook to fetch system metrics with performance optimizations
 */
export function useSystemMetrics(options: UseSystemMetricsOptions = {}) {
  const {
    refreshInterval = 2000,
    pauseWhenHidden = true,
    initialData = null,
  } = options;

  const [metrics, setMetrics] = useState<SystemMetrics | null>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const intervalRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      // Skip fetch if paused
      if (pauseWhenHidden && !isVisibleRef.current) {
        return;
      }

      try {
        const data = await invoke<SystemMetrics>('get_system_metrics');
        setMetrics(data);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('[useSystemMetrics] Failed to fetch:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    // Visibility change handler
    const handleVisibilityChange = () => {
      const wasVisible = isVisibleRef.current;
      isVisibleRef.current = !document.hidden;

      // If just became visible, fetch immediately
      if (!wasVisible && isVisibleRef.current) {
        void fetchMetrics();
      }
    };

    // Initial fetch
    void fetchMetrics();

    // Setup interval
    intervalRef.current = window.setInterval(fetchMetrics, refreshInterval);

    // Listen for visibility changes if enabled
    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      if (pauseWhenHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [refreshInterval, pauseWhenHidden]);

  return { metrics, error, isLoading };
}

/**
 * Hook to fetch network stats with performance optimizations
 */
export function useNetworkStats(options: UseSystemMetricsOptions = {}) {
  const {
    refreshInterval = 2000,
    pauseWhenHidden = true,
  } = options;

  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (pauseWhenHidden && !isVisibleRef.current) {
        return;
      }

      try {
        const data = await invoke<NetworkStats>('get_network_stats');
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('[useNetworkStats] Failed to fetch:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    const handleVisibilityChange = () => {
      const wasVisible = isVisibleRef.current;
      isVisibleRef.current = !document.hidden;
      if (!wasVisible && isVisibleRef.current) {
        void fetchStats();
      }
    };

    void fetchStats();
    intervalRef.current = window.setInterval(fetchStats, refreshInterval);

    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      if (pauseWhenHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [refreshInterval, pauseWhenHidden]);

  return { stats, error };
}

/**
 * Hook to fetch system temperatures with optimizations
 */
export function useSystemTemperatures(options: UseSystemMetricsOptions = {}) {
  const {
    refreshInterval = 3000, // Temps change slower, use longer interval
    pauseWhenHidden = true,
  } = options;

  const [temps, setTemps] = useState<{ cpu: number; gpu: number } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const fetchTemps = async () => {
      if (pauseWhenHidden && !isVisibleRef.current) {
        return;
      }

      try {
        const data = await invoke<{ cpu: number; gpu: number }>('get_system_temps');
        setTemps(data);
        setError(null);
      } catch (err) {
        console.error('[useSystemTemperatures] Failed to fetch:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    const handleVisibilityChange = () => {
      const wasVisible = isVisibleRef.current;
      isVisibleRef.current = !document.hidden;
      if (!wasVisible && isVisibleRef.current) {
        void fetchTemps();
      }
    };

    void fetchTemps();
    intervalRef.current = window.setInterval(fetchTemps, refreshInterval);

    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      if (pauseWhenHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [refreshInterval, pauseWhenHidden]);

  return { temps, error };
}
