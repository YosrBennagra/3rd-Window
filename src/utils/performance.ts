/**
 * Performance-Optimized Zustand Selectors
 * 
 * Provides memoized selectors for efficient component subscriptions.
 * Following performance optimization principles:
 * - Subscribe to minimal state slices
 * - Avoid whole-store subscriptions
 * - Use shallow equality where appropriate
 */

import { useCallback, useEffect, useRef } from 'react';
import { StoreApi, UseBoundStore } from 'zustand';
import { shallow } from 'zustand/shallow';

/**
 * Create a selector hook that only re-renders when selected values change
 * Uses shallow comparison for object/array results
 */
export function createShallowSelector<T extends object, R>(
  useStore: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => R
) {
  return () => useStore(selector, shallow);
}

/**
 * Create a selector for a single primitive value
 * More efficient than shallow comparison for primitives
 */
export function createValueSelector<T extends object, R>(
  useStore: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => R
) {
  return () => useStore(selector);
}

/**
 * Create a memoized action selector that doesn't cause re-renders
 * Actions never change, so we can optimize by only selecting once
 */
export function createActionSelector<T extends object, R extends Function>(
  useStore: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => R
) {
  return () => {
    return useCallback(useStore.getState()[selector.name as keyof T] as R, []);
  };
}

/**
 * Performance monitoring hook for Zustand subscriptions
 * Use in development to detect excessive re-renders
 */
export function usePerformanceMonitor(componentName: string, deps: unknown[]) {
  const renderCount = useRef(0);
  const prevDeps = useRef(deps);

  renderCount.current++;

  useEffect(() => {
    const changedDeps = deps
      .map((dep, i) => (dep !== prevDeps.current[i] ? i : null))
      .filter((i) => i !== null);

    if (changedDeps.length > 0) {
      console.log(
        `[Perf] ${componentName} re-rendered (#${renderCount.current}), changed deps: ${changedDeps.join(', ')}`
      );
    }

    prevDeps.current = deps;
  });
}

