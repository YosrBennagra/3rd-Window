/**
 * Registry Utilities (SOLID: Single Responsibility + Security)
 * 
 * Safe, minimal registry access utilities for Windows integration.
 * All registry operations are scoped to HKCU (current user).
 * 
 * Design Principles:
 * - Minimal Privilege: Only HKCU, never HKLM (no admin required)
 * - Reversibility: All writes can be undone
 * - Safety: Error handling, no panics
 * - Logging: All operations logged for diagnostics
 * - Validation: Input validation before registry writes
 * 
 * Registry Keys Used by ThirdScreen:
 * - HKCU:\Software\Classes\thirdscreen                     (protocol handler)
 * - HKCU:\Software\Classes\DesktopBackground\Shell\ThirdScreen (context menu)
 * - HKCU:\Software\Classes\CLSID\{...}                     (modern context menu handler)
 * - HKCU:\Software\Microsoft\Windows\CurrentVersion\Run    (startup)
 */

use std::io;
use winreg::enums::*;
use winreg::RegKey;

const APP_NAME: &str = "ThirdScreen";

/**
 * Cleanup all ThirdScreen registry keys
 * 
 * Called during full uninstall to remove all traces.
 * Does not remove user preferences (only integration keys).
 * 
 * This is a destructive operation - use with caution.
 * Typically only called by uninstaller.
 */
pub fn cleanup_all_registry_keys() -> Result<(), io::Error> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    
    println!("[Registry] Cleaning up all registry keys...");
    
    let mut errors = Vec::new();
    
    // Remove protocol handler
    if let Err(e) = remove_key(&hkcu, r"Software\Classes\thirdscreen") {
        if e.kind() != io::ErrorKind::NotFound {
            errors.push(format!("Protocol handler: {}", e));
        }
    }
    
    // Remove context menu (classic)
    if let Err(e) = remove_key(&hkcu, r"Software\Classes\DesktopBackground\Shell\ThirdScreen") {
        if e.kind() != io::ErrorKind::NotFound {
            errors.push(format!("Classic context menu: {}", e));
        }
    }
    
    // Remove context menu (modern handler)
    if let Err(e) = remove_key(&hkcu, r"Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}") {
        if e.kind() != io::ErrorKind::NotFound {
            errors.push(format!("Modern context menu handler: {}", e));
        }
    }
    
    // Remove startup entry
    if let Err(e) = remove_startup_entry(&hkcu) {
        if e.kind() != io::ErrorKind::NotFound {
            errors.push(format!("Startup entry: {}", e));
        }
    }
    
    if errors.is_empty() {
        println!("[Registry] ✓ All registry keys cleaned up successfully");
        Ok(())
    } else {
        let error_msg = errors.join(", ");
        eprintln!("[Registry] ✗ Some errors occurred during cleanup: {}", error_msg);
        Err(io::Error::new(io::ErrorKind::Other, error_msg))
    }
}

/**
 * Check if any ThirdScreen registry keys exist
 * 
 * Returns true if any integration keys are present.
 * Useful for determining if cleanup is needed.
 */
pub fn has_registry_keys() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    
    key_exists(&hkcu, r"Software\Classes\thirdscreen")
        || key_exists(&hkcu, r"Software\Classes\DesktopBackground\Shell\ThirdScreen")
        || key_exists(&hkcu, r"Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}")
        || startup_entry_exists(&hkcu)
}

/**
 * Get list of all ThirdScreen registry keys
 * 
 * Returns paths of all registry keys created by ThirdScreen.
 * Useful for diagnostics and manual cleanup.
 */
pub fn list_registry_keys() -> Vec<String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let mut keys = Vec::new();
    
    if key_exists(&hkcu, r"Software\Classes\thirdscreen") {
        keys.push(r"HKCU:\Software\Classes\thirdscreen".to_string());
    }
    
    if key_exists(&hkcu, r"Software\Classes\DesktopBackground\Shell\ThirdScreen") {
        keys.push(r"HKCU:\Software\Classes\DesktopBackground\Shell\ThirdScreen".to_string());
    }
    
    if key_exists(&hkcu, r"Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}") {
        keys.push(r"HKCU:\Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}".to_string());
    }
    
    if startup_entry_exists(&hkcu) {
        keys.push(format!(r"HKCU:\Software\Microsoft\Windows\CurrentVersion\Run\{}", APP_NAME));
    }
    
    keys
}

/**
 * Validate registry key path
 * 
 * Ensures key path is safe and within allowed scope.
 * Prevents accidentally modifying system keys.
 * 
 * Allowed prefixes:
 * - Software\Classes\thirdscreen
 * - Software\Classes\DesktopBackground\Shell\ThirdScreen
 * - Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}
 * - Software\Microsoft\Windows\CurrentVersion\Run
 */
#[allow(dead_code)]
pub fn validate_key_path(path: &str) -> bool {
    let allowed_prefixes = [
        r"Software\Classes\thirdscreen",
        r"Software\Classes\DesktopBackground\Shell\ThirdScreen",
        r"Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}",
        r"Software\Microsoft\Windows\CurrentVersion\Run",
    ];
    
    allowed_prefixes.iter().any(|prefix| path.starts_with(prefix))
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Remove a registry key and all subkeys
 */
fn remove_key(hkcu: &RegKey, path: &str) -> Result<(), io::Error> {
    println!("[Registry] Removing key: {}", path);
    
    match hkcu.delete_subkey_all(path) {
        Ok(_) => {
            println!("[Registry] ✓ Removed: {}", path);
            Ok(())
        }
        Err(e) => {
            if e.kind() == io::ErrorKind::NotFound {
                println!("[Registry] ℹ Key not found: {}", path);
            } else {
                eprintln!("[Registry] ✗ Failed to remove {}: {}", path, e);
            }
            Err(e)
        }
    }
}

/**
 * Check if a registry key exists
 */
fn key_exists(hkcu: &RegKey, path: &str) -> bool {
    hkcu.open_subkey(path).is_ok()
}

/**
 * Remove startup entry
 */
fn remove_startup_entry(hkcu: &RegKey) -> Result<(), io::Error> {
    let run_key_path = r"Software\Microsoft\Windows\CurrentVersion\Run";
    
    if let Ok(run_key) = hkcu.open_subkey_with_flags(run_key_path, KEY_WRITE) {
        run_key.delete_value(APP_NAME)
    } else {
        Err(io::Error::new(io::ErrorKind::NotFound, "Run key not found"))
    }
}

/**
 * Check if startup entry exists
 */
fn startup_entry_exists(hkcu: &RegKey) -> bool {
    let run_key_path = r"Software\Microsoft\Windows\CurrentVersion\Run";
    
    if let Ok(run_key) = hkcu.open_subkey(run_key_path) {
        run_key.get_value::<String, _>(APP_NAME).is_ok()
    } else {
        false
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_validate_key_path() {
        // Valid paths
        assert!(validate_key_path(r"Software\Classes\thirdscreen"));
        assert!(validate_key_path(r"Software\Classes\thirdscreen\shell"));
        assert!(validate_key_path(r"Software\Classes\DesktopBackground\Shell\ThirdScreen"));
        assert!(validate_key_path(r"Software\Microsoft\Windows\CurrentVersion\Run"));
        
        // Invalid paths
        assert!(!validate_key_path(r"Software\Classes\otherapp"));
        assert!(!validate_key_path(r"Software\Microsoft\Windows"));
        assert!(!validate_key_path(r"SYSTEM"));
    }
}
