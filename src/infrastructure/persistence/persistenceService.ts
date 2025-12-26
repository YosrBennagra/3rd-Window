/**
 * Persistence Service
 * 
 * High-level persistence API that wraps Tauri persistence commands.
 * This service is the single point of interaction with persisted state.
 * 
 * Responsibilities:
 * - Loading and saving complete persisted state
 * - Type-safe interaction with Tauri commands
 * - Error handling and logging
 * 
 * Does NOT:
 * - Manage runtime state (that's stores' responsibility)
 * - Perform validation (that's Rust's responsibility)
 * - Handle partial updates (always save/load complete state)
 */

import { invoke } from '@tauri-apps/api/core';
import type { PersistedState } from '../../types/persistence';

/**
 * Loads complete persisted state with automatic recovery
 * 
 * This command handles migration, validation, and recovery automatically.
 * Never fails - worst case returns safe defaults.
 * 
 * @returns Complete persisted state (always safe to use)
 */
export async function loadPersistedState(): Promise<PersistedState> {
  try {
    const state = await invoke<PersistedState>('load_persisted_state');
    console.info('[Persistence] State loaded successfully (v' + state.version + ')');
    return state;
  } catch (error) {
    console.error('[Persistence] Failed to load state:', error);
    throw new Error('Failed to load persisted state: ' + error);
  }
}

/**
 * Saves complete persisted state atomically
 * 
 * This performs atomic writes with backup, ensuring data integrity.
 * Validation happens on the Rust side.
 * 
 * @param state Complete state to persist
 */
export async function savePersistedState(state: PersistedState): Promise<void> {
  try {
    await invoke('save_persisted_state', { state });
    console.info('[Persistence] State saved successfully (v' + state.version + ')');
  } catch (error) {
    console.error('[Persistence] Failed to save state:', error);
    throw new Error('Failed to save persisted state: ' + error);
  }
}

/**
 * Resets persisted state to defaults
 * 
 * This is a destructive operation. Use for:
 * - User-requested reset
 * - Testing/development
 * - Recovery from unrecoverable corruption
 * 
 * @returns Fresh default state
 */
export async function resetPersistedState(): Promise<PersistedState> {
  try {
    const state = await invoke<PersistedState>('reset_persisted_state');
    console.warn('[Persistence] State reset to defaults');
    return state;
  } catch (error) {
    console.error('[Persistence] Failed to reset state:', error);
    throw new Error('Failed to reset persisted state: ' + error);
  }
}

/**
 * Gets current schema version
 * 
 * Useful for diagnostics and version checks.
 * 
 * @returns Current schema version number
 */
export async function getSchemaVersion(): Promise<number> {
  try {
    return await invoke<number>('get_schema_version');
  } catch (error) {
    console.error('[Persistence] Failed to get schema version:', error);
    return 1; // Safe fallback
  }
}

/**
 * Checks if persisted state version matches current schema
 * 
 * @param state State to check
 * @returns True if versions match, false if migration needed
 */
export async function isStateVersionCurrent(state: PersistedState): Promise<boolean> {
  const currentVersion = await getSchemaVersion();
  return state.version === currentVersion;
}
