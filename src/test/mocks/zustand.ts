/**
 * Zustand Store Mocks
 * 
 * Utilities for testing components that use Zustand stores.
 * Provides isolated store instances and mock creators.
 * 
 * Usage:
 * ```typescript
 * import { createMockStore } from '@/test/mocks/zustand';
 * 
 * const mockStore = createMockStore({ ...initialState });
 * ```
 */

import { create } from 'zustand';
import type { StateCreator } from 'zustand';

/**
 * Create a mock Zustand store with initial state
 */
export function createMockStore<T>(initialState: Partial<T>) {
  return create<T>(() => initialState as T);
}

/**
 * Create a testable store that tracks actions
 */
export function createTestStore<T>(storeCreator: StateCreator<T>) {
  const actions: Array<{ name: string; args: unknown[] }> = [];
  
  const wrappedCreator: StateCreator<T> = (set, get, api) => {
    const state = storeCreator(
      (partial, replace) => {
        // Track actions
        if (typeof partial === 'function') {
          actions.push({ name: 'update', args: [partial] });
        }
        set(partial, replace);
      },
      get,
      api
    );
    return state;
  };

  const store = create<T>(wrappedCreator);
  
  return {
    store,
    actions,
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe,
    clearActions: () => actions.splice(0, actions.length),
  };
}

/**
 * Helper to test store selectors
 */
export function testSelector<T, R>(
  selector: (state: T) => R,
  state: T,
  expected: R
) {
  const result = selector(state);
  return { result, expected, matches: result === expected };
}
