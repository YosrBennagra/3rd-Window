import { useEffect, useState } from 'react';

/**
 * Custom Hook: useInterval (React 18 Best Practice)
 * 
 * Encapsulates interval behavior.
 * Follows React principles:
 * - Reusable interval logic
 * - Proper cleanup
 * - Type-safe
 */

export function useInterval(callback: () => void, delay: number | null) {
  useEffect(() => {
    if (delay === null) return;
    
    const interval = setInterval(callback, delay);
    return () => clearInterval(interval);
  }, [callback, delay]);
}

/**
 * Custom Hook: useClock (React 18 Best Practice)
 * 
 * Manages clock state with configurable update interval.
 * Follows React principles:
 * - Extracted time management logic
 * - Proper effect cleanup
 * - Reusable across clock widgets
 */

interface UseClockOptions {
  /**
   * Update interval in milliseconds
   * @default 60000 (1 minute)
   */
  interval?: number;
}

export function useClock(options: UseClockOptions = {}) {
  const { interval = 60000 } = options;
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    // Update immediately on mount
    setTime(new Date());
    
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return time;
}
