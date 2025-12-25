/**
 * Windows Startup Manager (SOLID: Single Responsibility + User Control)
 * 
 * Manages Windows startup behavior for ThirdScreen.
 * Allows users to enable/disable auto-start with Windows.
 * 
 * Design Principles:
 * - User Control: Never auto-enable without explicit consent
 * - Reversibility: Easy to disable via settings or manually
 * - Transparency: Clear about what startup does (shows in Task Manager)
 * - Minimal Privilege: Uses HKCU Run key (no admin required)
 * - No Hidden Processes: When disabled, app truly doesn't start
 * 
 * Registry Location:
 * HKCU:\Software\Microsoft\Windows\CurrentVersion\Run\ThirdScreen
 * 
 * Security: Uses standard Windows startup mechanism (Run key).
 * No services, no scheduled tasks, no hidden processes.
 */

use std::io;
use winreg::enums::*;
use winreg::RegKey;

const APP_NAME: &str = "ThirdScreen";
const RUN_KEY_PATH: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";

/**
 * Enable startup
 * 
 * Adds ThirdScreen to Windows startup.
 * App will auto-start when user logs in.
 * 
 * Registry: HKCU:\...\Run\ThirdScreen = "<exe_path>"
 * 
 * Note: Uses HKCU (current user only), not HKLM (all users).
 * This way no admin privileges are required.
 */
pub fn enable() -> Result<(), io::Error> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let exe_path = get_exe_path();
    
    println!("[Startup] Enabling startup...");
    
    let (run_key, _) = hkcu.create_subkey(RUN_KEY_PATH)?;
    run_key.set_value(APP_NAME, &format!("\"{}\"", exe_path))?;
    
    println!("[Startup] ✓ Startup enabled");
    println!("[Startup] App will start automatically when Windows starts");
    Ok(())
}

/**
 * Disable startup
 * 
 * Removes ThirdScreen from Windows startup.
 * App will NOT auto-start when user logs in.
 */
pub fn disable() -> Result<(), io::Error> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    
    println!("[Startup] Disabling startup...");
    
    if let Ok(run_key) = hkcu.open_subkey_with_flags(RUN_KEY_PATH, KEY_WRITE) {
        match run_key.delete_value(APP_NAME) {
            Ok(_) => {
                println!("[Startup] ✓ Startup disabled");
                Ok(())
            }
            Err(e) if e.kind() == io::ErrorKind::NotFound => {
                println!("[Startup] ℹ Startup not found (already disabled)");
                Ok(())
            }
            Err(e) => {
                eprintln!("[Startup] ✗ Failed to disable startup: {}", e);
                Err(e)
            }
        }
    } else {
        println!("[Startup] ℹ Run key not found");
        Ok(())
    }
}

/**
 * Check if startup is enabled
 * 
 * Returns true if ThirdScreen is in Windows startup.
 * Used by UI to show current state.
 */
pub fn is_startup_enabled() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    
    if let Ok(run_key) = hkcu.open_subkey(RUN_KEY_PATH) {
        run_key.get_value::<String, _>(APP_NAME).is_ok()
    } else {
        false
    }
}

/**
 * Get startup command
 * 
 * Returns the command that will be executed on startup.
 * Useful for debugging or showing user what will run.
 * 
 * @returns Some(command) if startup is enabled, None otherwise
 */
#[allow(dead_code)]
pub fn get_startup_command() -> Option<String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    
    if let Ok(run_key) = hkcu.open_subkey(RUN_KEY_PATH) {
        run_key.get_value::<String, _>(APP_NAME).ok()
    } else {
        None
    }
}

/**
 * Toggle startup
 * 
 * Convenience method to toggle startup on/off.
 * 
 * @returns new state (true = enabled, false = disabled)
 */
pub fn toggle() -> Result<bool, io::Error> {
    if is_startup_enabled() {
        disable()?;
        Ok(false)
    } else {
        enable()?;
        Ok(true)
    }
}

/**
 * Get executable path
 * 
 * Returns absolute path to ThirdScreen.exe.
 * This is the path that will be executed on startup.
 */
fn get_exe_path() -> String {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.to_str().map(String::from))
        .unwrap_or_else(|| {
            eprintln!("[Startup] Warning: Could not determine exe path");
            String::from("ThirdScreen.exe")
        })
}

// ============================================================================
// Tauri Commands (IPC Layer)
// ============================================================================

// End of startup module
// Tauri commands are defined in commands/windows_integration.rs which delegates to these functions
