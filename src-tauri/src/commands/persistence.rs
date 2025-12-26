// Persistence Commands
//
// Tauri commands for frontend to interact with persisted state.
// These commands provide high-level operations that delegate to
// the persistence layer modules.

use crate::persistence::{
    load_state, migrations::apply_migrations, recovery::recover_state, save_state, PersistedState,
    RecoveryMode,
};
use tauri::AppHandle;

/// Loads persisted state with automatic recovery and migration
///
/// This command handles the full persistence lifecycle:
/// 1. Load raw state from disk (or None if first run)
/// 2. Apply migrations to current version
/// 3. Validate and recover from any issues
/// 4. Return safe, usable state
///
/// Never fails - worst case returns safe defaults.
#[tauri::command]
pub async fn load_persisted_state(app: AppHandle) -> Result<PersistedState, String> {
    log::info!("Loading persisted state...");

    // Step 1: Load raw state from disk
    let raw_state = match load_state(&app) {
        Ok(state) => state,
        Err(e) => {
            log::error!("Failed to load state file: {}", e);
            // Treat as if no state exists - recovery will use defaults
            None
        },
    };

    // Step 2: Apply migrations if needed
    let migrated_state = match raw_state {
        Some(state) => {
            match apply_migrations(state) {
                Ok(migrated) => Some(migrated),
                Err(e) => {
                    log::error!("Migration failed: {}", e);
                    // Treat as corrupted - recovery will handle
                    None
                },
            }
        },
        None => None,
    };

    // Step 3: Validate and recover
    let recovery_result = recover_state(migrated_state);

    // Log recovery details
    match recovery_result.mode {
        RecoveryMode::Clean => {
            log::info!("State loaded cleanly (v{})", recovery_result.state.version);
        },
        RecoveryMode::Sanitized => {
            log::warn!("State sanitized ({} issue(s) fixed)", recovery_result.report.len());
            for issue in &recovery_result.report {
                log::warn!("  - {}", issue);
            }
        },
        RecoveryMode::Partial => {
            log::warn!("Partial recovery ({} issue(s) remain)", recovery_result.report.len());
            for issue in &recovery_result.report {
                log::warn!("  - {}", issue);
            }
        },
        RecoveryMode::Reset => {
            log::warn!("State reset to defaults");
            for reason in &recovery_result.report {
                log::warn!("  - {}", reason);
            }
        },
    }

    Ok(recovery_result.state)
}

/// Saves persisted state to disk
///
/// This performs atomic writes with backup, ensuring we never corrupt
/// the state file even if the app crashes during save.
#[tauri::command]
pub async fn save_persisted_state(app: AppHandle, state: PersistedState) -> Result<(), String> {
    log::info!("Saving persisted state (v{})...", state.version);

    // Validate before saving
    let warnings = state.validate();
    if !warnings.is_empty() {
        log::warn!("Saving state with {} validation warning(s):", warnings.len());
        for warning in &warnings {
            log::warn!("  - {}", warning);
        }
        // Continue anyway - validation warnings are not fatal
    }

    // Save to disk atomically
    save_state(&app, &state)?;

    log::info!("Persisted state saved successfully");
    Ok(())
}

/// Resets persisted state to defaults
///
/// This is useful for:
/// - Testing/development
/// - User-requested reset
/// - Recovering from unrecoverable corruption
#[tauri::command]
pub async fn reset_persisted_state(app: AppHandle) -> Result<PersistedState, String> {
    log::warn!("Resetting persisted state to defaults...");

    let default_state = PersistedState::default();
    save_state(&app, &default_state)?;

    log::info!("State reset complete");
    Ok(default_state)
}

/// Gets current schema version
///
/// Useful for debugging and diagnostics
#[tauri::command]
pub fn get_schema_version() -> u32 {
    crate::persistence::schemas::CURRENT_VERSION
}
