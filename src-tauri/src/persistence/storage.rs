// Storage Operations
//
// This module handles file I/O for persisted state. It is the only place
// that interacts with the filesystem for state persistence.
//
// Responsibilities:
// - Reading and writing state files
// - Handling file system errors gracefully
// - Ensuring atomic writes (write to temp, then rename)
// - Creating backup files before overwriting
//
// This module does NOT:
// - Validate state (that's schemas.rs)
// - Perform migrations (that's migrations.rs)
// - Handle recovery (that's recovery.rs)

use super::schemas::PersistedState;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const STATE_FILENAME: &str = "state.json";
const BACKUP_FILENAME: &str = "state.backup.json";
const TEMP_FILENAME: &str = "state.tmp.json";

/// Gets the path to the state file
fn get_state_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
        .map(|mut path| {
            path.push(STATE_FILENAME);
            path
        })
}

/// Gets the path to the backup state file
fn get_backup_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
        .map(|mut path| {
            path.push(BACKUP_FILENAME);
            path
        })
}

/// Gets the path to the temporary state file (used for atomic writes)
fn get_temp_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
        .map(|mut path| {
            path.push(TEMP_FILENAME);
            path
        })
}

/// Loads persisted state from disk
///
/// Returns Ok(Some(state)) if file exists and is readable
/// Returns Ok(None) if file doesn't exist (first run)
/// Returns Err(msg) if file exists but is corrupted
pub fn load_state(app: &AppHandle) -> Result<Option<PersistedState>, String> {
    let state_path = get_state_path(app)?;
    
    if !state_path.exists() {
        // First run or state was deleted - this is OK
        return Ok(None);
    }
    
    // Try to read and parse the state file
    match fs::read_to_string(&state_path) {
        Ok(json) => {
            match serde_json::from_str::<PersistedState>(&json) {
                Ok(state) => {
                    log::info!("Loaded persisted state v{}", state.version);
                    Ok(Some(state))
                }
                Err(e) => {
                    // JSON is corrupted - try backup
                    log::error!("Failed to parse state file: {}", e);
                    load_backup(app)
                }
            }
        }
        Err(e) => {
            // File exists but can't be read - try backup
            log::error!("Failed to read state file: {}", e);
            load_backup(app)
        }
    }
}

/// Attempts to load the backup state file
fn load_backup(app: &AppHandle) -> Result<Option<PersistedState>, String> {
    let backup_path = get_backup_path(app)?;
    
    if !backup_path.exists() {
        return Err("State file corrupted and no backup available".to_string());
    }
    
    log::warn!("Attempting to load from backup...");
    
    match fs::read_to_string(&backup_path) {
        Ok(json) => {
            match serde_json::from_str::<PersistedState>(&json) {
                Ok(state) => {
                    log::info!("Successfully loaded from backup (v{})", state.version);
                    Ok(Some(state))
                }
                Err(e) => {
                    log::error!("Backup is also corrupted: {}", e);
                    Err("Both state file and backup are corrupted".to_string())
                }
            }
        }
        Err(e) => {
            log::error!("Failed to read backup file: {}", e);
            Err(format!("Failed to read backup: {}", e))
        }
    }
}

/// Saves persisted state to disk atomically
///
/// This function:
/// 1. Backs up the current state file (if it exists)
/// 2. Writes to a temporary file
/// 3. Renames temp file to actual state file (atomic on most filesystems)
///
/// This ensures that we never corrupt the state file if the write fails
/// or the app crashes during save.
pub fn save_state(app: &AppHandle, state: &PersistedState) -> Result<(), String> {
    let state_path = get_state_path(app)?;
    let backup_path = get_backup_path(app)?;
    let temp_path = get_temp_path(app)?;
    
    // Ensure app data directory exists
    if let Some(parent) = state_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }
    
    // Backup existing state file before overwriting
    if state_path.exists() {
        if let Err(e) = fs::copy(&state_path, &backup_path) {
            log::warn!("Failed to create backup: {}", e);
            // Continue anyway - backup failure shouldn't block saves
        }
    }
    
    // Serialize state to JSON (pretty-printed for human readability)
    let json = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize state: {}", e))?;
    
    // Write to temporary file first
    fs::write(&temp_path, &json)
        .map_err(|e| format!("Failed to write temp state file: {}", e))?;
    
    // Atomic rename (replaces existing state file)
    fs::rename(&temp_path, &state_path)
        .map_err(|e| format!("Failed to finalize state file: {}", e))?;
    
    log::info!("Persisted state v{} ({} bytes)", state.version, json.len());
    
    Ok(())
}

/// Deletes all persisted state files
///
/// This is a destructive operation used for testing or explicit user reset.
/// Returns the number of files successfully deleted.
pub fn delete_state(app: &AppHandle) -> Result<usize, String> {
    let mut deleted = 0;
    
    let state_path = get_state_path(app)?;
    if state_path.exists() {
        fs::remove_file(&state_path)
            .map_err(|e| format!("Failed to delete state file: {}", e))?;
        deleted += 1;
    }
    
    let backup_path = get_backup_path(app)?;
    if backup_path.exists() {
        fs::remove_file(&backup_path)
            .map_err(|e| format!("Failed to delete backup file: {}", e))?;
        deleted += 1;
    }
    
    let temp_path = get_temp_path(app)?;
    if temp_path.exists() {
        if let Err(e) = fs::remove_file(&temp_path) {
            log::warn!("Failed to delete temp file: {}", e);
        } else {
            deleted += 1;
        }
    }
    
    log::info!("Deleted {} state file(s)", deleted);
    Ok(deleted)
}

/// Checks if state files exist
pub fn state_exists(app: &AppHandle) -> Result<bool, String> {
    let state_path = get_state_path(app)?;
    Ok(state_path.exists())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_state_filename_constants() {
        assert_eq!(STATE_FILENAME, "state.json");
        assert_eq!(BACKUP_FILENAME, "state.backup.json");
        assert_eq!(TEMP_FILENAME, "state.tmp.json");
    }
    
    // Note: Testing actual file I/O requires a Tauri app handle,
    // which is not available in unit tests. Integration tests should
    // cover save/load/backup scenarios.
}
