/**
 * Uninstaller Module
 *
 * Handles clean uninstallation of ThirdScreen from Windows systems.
 * Ensures all OS integrations are properly removed.
 *
 * Distribution Awareness Principle:
 * "Install Cleanly, Leave Cleanly" - All system modifications
 * made during installation/runtime must be reversible.
 *
 * Cleanup Checklist:
 * ✓ Registry keys (protocol handler, context menu, startup)
 * ✓ Background processes terminated
 * ✓ User preferences preserved (optional)
 * ✓ Log files preserved (for diagnostics)
 *
 * What We DON'T Remove:
 * - User settings/preferences (in AppData)
 * - User widget layouts
 * - Log files (for troubleshooting)
 *
 * Users can manually delete AppData if they want complete removal.
 */
#[cfg(target_os = "windows")]
use crate::system::windows_integration::registry_utils;

/// Performs complete uninstall cleanup
///
/// This function is called by the uninstaller (or can be called manually
/// from settings UI as "Factory Reset").
///
/// Steps:
/// 1. Disable startup (if enabled)
/// 2. Remove context menu entries
/// 3. Remove protocol handler registration
/// 4. Clean up all registry keys
///
/// Returns Ok(()) if cleanup succeeded, Err(msg) if any step failed.
/// Partial failures are logged but don't prevent other cleanup steps.
pub fn perform_uninstall_cleanup() -> Result<(), String> {
    log::info!("=== Starting Uninstall Cleanup ===");

    #[cfg(target_os = "windows")]
    {
        let mut errors = Vec::new();

        // Step 1: Disable startup
        log::info!("Step 1: Disabling startup...");
        if let Err(e) = crate::system::windows_integration::startup::disable() {
            log::error!("Failed to disable startup: {}", e);
            errors.push(format!("Startup: {}", e));
        } else {
            log::info!("✓ Startup disabled");
        }

        // Step 2: Remove context menu
        log::info!("Step 2: Removing context menu...");
        if let Err(e) = crate::commands::context_menu::uninstall_context_menu() {
            log::error!("Failed to remove context menu: {}", e);
            errors.push(format!("Context menu: {}", e));
        } else {
            log::info!("✓ Context menu removed");
        }

        // Step 3: Clean all registry keys
        log::info!("Step 3: Cleaning registry keys...");
        if let Err(e) = registry_utils::cleanup_all_registry_keys() {
            log::error!("Failed to clean registry: {}", e);
            errors.push(format!("Registry: {}", e));
        } else {
            log::info!("✓ Registry keys cleaned");
        }

        if errors.is_empty() {
            log::info!("=== Uninstall Cleanup Complete ===");
            log::info!("User settings preserved in AppData (delete manually if needed)");
            Ok(())
        } else {
            let error_msg = format!(
                "Uninstall completed with {} error(s): {}",
                errors.len(),
                errors.join(", ")
            );
            log::error!("{}", error_msg);
            Err(error_msg)
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        log::info!("Uninstall cleanup not required on this platform");
        Ok(())
    }
}

/// Check if any OS integrations are still active
///
/// Returns true if any registry keys, startup entries, or context menu
/// entries are still present. Useful for:
/// - Verifying uninstall completed successfully
/// - "Factory Reset" feature in settings
/// - Diagnostics
pub fn has_active_integrations() -> bool {
    #[cfg(target_os = "windows")]
    {
        use crate::system::windows_integration::startup;

        // Check if any integration is active
        registry_utils::has_registry_keys() || startup::is_startup_enabled()
    }

    #[cfg(not(target_os = "windows"))]
    false
}

/// Get list of active OS integrations
///
/// Returns human-readable list of active integrations.
/// Useful for diagnostics and "Cleanup" UI.
pub fn list_active_integrations() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        use crate::system::windows_integration::startup;

        let mut integrations = Vec::new();

        // Check startup
        if startup::is_startup_enabled() {
            integrations.push("Windows Startup enabled".to_string());
        }

        // Check registry keys
        let registry_keys = registry_utils::list_registry_keys();
        if !registry_keys.is_empty() {
            integrations.push(format!("Registry keys: {} entries", registry_keys.len()));
        }

        integrations
    }

    #[cfg(not(target_os = "windows"))]
    vec![]
}

// ============================================================================
// Tauri Commands for UI
// ============================================================================

/// Command: Perform uninstall cleanup
///
/// Exposed to frontend for "Factory Reset" feature.
/// Warning: This removes all OS integrations!
#[tauri::command]
pub async fn uninstall_cleanup() -> Result<(), String> {
    perform_uninstall_cleanup()
}

/// Command: Check if integrations are active
#[tauri::command]
pub fn check_active_integrations() -> bool {
    has_active_integrations()
}

/// Command: List active integrations
#[tauri::command]
pub fn list_integrations() -> Vec<String> {
    list_active_integrations()
}
