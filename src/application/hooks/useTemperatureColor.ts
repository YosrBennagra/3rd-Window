import { useMemo } from 'react';

/**
 * Custom Hook: useTemperatureColor (React 18 Best Practice)
 * 
 * Encapsulates temperature color calculation logic.
 * Follows React principles:
 * - Pure function logic extracted from component
 * - Memoized for performance
 * - Reusable across temperature displays
 * - Single responsibility
 */

interface TemperatureThresholds {
  warning: number;
  critical: number;
}

const DEFAULT_CPU_THRESHOLDS: TemperatureThresholds = {
  warning: 70,
  critical: 80,
};

const DEFAULT_GPU_THRESHOLDS: TemperatureThresholds = {
  warning: 75,
  critical: 85,
};

interface UseTemperatureColorOptions {
  type?: 'cpu' | 'gpu';
  customThresholds?: TemperatureThresholds;
}

export function useTemperatureColor(
  temperature: number,
  options: UseTemperatureColorOptions = {}
) {
  const { type = 'cpu', customThresholds } = options;

  const color = useMemo(() => {
    const thresholds = customThresholds ?? 
      (type === 'cpu' ? DEFAULT_CPU_THRESHOLDS : DEFAULT_GPU_THRESHOLDS);

    if (temperature < thresholds.warning) return '#4ade80'; // Green
    if (temperature < thresholds.critical) return '#fbbf24'; // Yellow
    return '#ef4444'; // Red
  }, [temperature, type, customThresholds]);

  const status = useMemo(() => {
    const thresholds = customThresholds ?? 
      (type === 'cpu' ? DEFAULT_CPU_THRESHOLDS : DEFAULT_GPU_THRESHOLDS);

    if (temperature < thresholds.warning) return 'normal';
    if (temperature < thresholds.critical) return 'warning';
    return 'critical';
  }, [temperature, type, customThresholds]);

  return { color, status };
}

/**
 * Calculate temperature percentage for progress bars
 */
export function getTemperaturePercentage(temperature: number, max: number = 100): number {
  return Math.min((temperature / max) * 100, 100);
}
