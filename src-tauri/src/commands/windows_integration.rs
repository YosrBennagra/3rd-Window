/**
 * Windows Integration Commands (IPC Layer)
 *
 * Thin command wrappers that delegate to system::windows_integration modules.
 * These commands are registered in Tauri's invoke_handler for frontend access.
 */
use crate::system::windows_integration::{registry_utils, startup};

// ============================================================================
// Registry Utilities Commands
// ============================================================================

#[tauri::command]
pub fn list_integration_registry_keys() -> Vec<String> {
    registry_utils::list_registry_keys()
}

#[tauri::command]
pub fn check_registry_keys_exist() -> bool {
    registry_utils::has_registry_keys()
}

// ============================================================================
// Startup Management Commands
// ============================================================================

#[tauri::command]
pub fn enable_startup() -> Result<(), String> {
    startup::enable().map_err(|e| format!("Failed to enable startup: {}", e))
}

#[tauri::command]
pub fn disable_startup() -> Result<(), String> {
    startup::disable().map_err(|e| format!("Failed to disable startup: {}", e))
}

#[tauri::command]
pub fn check_startup_enabled() -> bool {
    startup::is_startup_enabled()
}

#[tauri::command]
pub fn toggle_startup() -> Result<bool, String> {
    startup::toggle().map_err(|e| format!("Failed to toggle startup: {}", e))
}
