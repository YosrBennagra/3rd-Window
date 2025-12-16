import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { SystemTemperatures } from '../types/system';

export function useSystemTemps(refreshInterval = 1000) {
  const [data, setData] = useState<SystemTemperatures | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemps = async () => {
      try {
        const result = await invoke<SystemTemperatures>('get_system_temps');
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Failed to get system temps:', err);
        setError(err as string);
      }
    };

    fetchTemps();
    const interval = setInterval(fetchTemps, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { data, error };
}
