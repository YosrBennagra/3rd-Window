/**
 * Windows Context Menu Integration (SOLID: Single Responsibility + Security)
 *
 * Manages Windows Explorer context menu entries for ThirdScreen.
 * Supports both classic right-click menu and Windows 11 modern context menu.
 *
 * Design Principles:
 * - Reversibility: All changes can be undone via uninstall()
 * - Minimal Privilege: Only writes to HKCU (no HKLM, no admin required)
 * - Clear Purpose: Menu entries are descriptive and scoped
 * - Security: Uses protocol handler, not direct shell execution
 * - User Control: Easy to enable/disable via settings
 *
 * Registry Keys Modified:
 * - HKCU:\Software\Classes\DesktopBackground\Shell\ThirdScreen (classic menu)
 * - HKCU:\Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7} (modern menu handler)
 */
use std::io;
use winreg::enums::*;
use winreg::RegKey;

#[allow(dead_code)]
const APP_NAME: &str = "ThirdScreen";
#[allow(dead_code)]
const MODERN_HANDLER_CLSID: &str = "{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}";

/**
 * Install context menu integration
 *
 * Creates registry entries for desktop right-click menu.
 * Uses protocol handler for security (no direct shell execution).
 *
 * Registry Structure:
 * ```
 * HKCU:\Software\Classes\DesktopBackground\Shell\ThirdScreen
 *   @              = "ThirdScreen - Add Widget"
 *   Icon           = "<exe path>"
 *   ExplorerCommandHandler = "{...CLSID...}"
 *   Position       = "Top"
 *   \command
 *     @            = "<exe> thirdscreen://open-picker"
 * ```
 */
#[allow(dead_code)]
pub fn install() -> Result<(), io::Error> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    println!("[ContextMenu] Installing context menu integration...");

    // Build command using protocol handler (security: no shell execution)
    let exe_path = get_exe_path();
    let command = format!("\"{}\" \"thirdscreen://open-picker\"", exe_path);

    // Install classic menu (Windows 10 and fallback for Windows 11)
    install_classic_menu(&hkcu, &exe_path, &command)?;

    // Register modern menu handler (Windows 11)
    register_modern_handler(&hkcu, &exe_path, &command)?;

    println!("[ContextMenu] ✓ Context menu installed successfully");
    Ok(())
}

/**
 * Uninstall context menu integration
 *
 * Removes all context menu registry entries.
 * Ensures clean uninstall with no leftover keys.
 */
pub fn uninstall() -> Result<(), io::Error> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    println!("[ContextMenu] Uninstalling context menu integration...");

    // Remove classic menu
    let shell_path = r"Software\Classes\DesktopBackground\Shell";
    if let Ok(shell_key) = hkcu.open_subkey_with_flags(shell_path, KEY_WRITE) {
        match shell_key.delete_subkey_all("ThirdScreen") {
            Ok(_) => println!("[ContextMenu] ✓ Removed classic menu"),
            Err(e) if e.kind() == io::ErrorKind::NotFound => {
                println!("[ContextMenu] ℹ Classic menu not found (already removed)")
            },
            Err(e) => eprintln!("[ContextMenu] ✗ Failed to remove classic menu: {}", e),
        }
    }

    // Remove modern handler
    let clsid_key_path = format!(r"Software\Classes\CLSID\{}", MODERN_HANDLER_CLSID);
    match hkcu.delete_subkey_all(&clsid_key_path) {
        Ok(_) => println!("[ContextMenu] ✓ Removed modern handler"),
        Err(e) if e.kind() == io::ErrorKind::NotFound => {
            println!("[ContextMenu] ℹ Modern handler not found (already removed)")
        },
        Err(e) => eprintln!("[ContextMenu] ✗ Failed to remove modern handler: {}", e),
    }

    println!("[ContextMenu] Uninstall complete");
    Ok(())
}

/**
 * Check if context menu is installed
 *
 * Verifies that registry keys exist.
 * Used by UI to show current state.
 */
pub fn is_installed() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let shell_path = r"Software\Classes\DesktopBackground\Shell\ThirdScreen";
    hkcu.open_subkey(shell_path).is_ok()
}

/**
 * Install classic context menu (Windows 10 and fallback)
 *
 * Creates menu entry in DesktopBackground\Shell.
 * Visible on Windows 10 and as fallback on Windows 11.
 */
fn install_classic_menu(hkcu: &RegKey, exe_path: &str, command: &str) -> Result<(), io::Error> {
    let shell_path = r"Software\Classes\DesktopBackground\Shell\ThirdScreen";
    let (shell_key, _) = hkcu.create_subkey(shell_path)?;

    // Menu text
    shell_key.set_value("", &format!("{} - Add Widget", APP_NAME))?;

    // Icon (uses .exe icon)
    shell_key.set_value("Icon", &exe_path)?;

    // Link to modern handler (for Windows 11)
    shell_key.set_value("ExplorerCommandHandler", &MODERN_HANDLER_CLSID)?;

    // Position at top of menu
    shell_key.set_value("Position", &"Top")?;

    // Command to execute
    let command_path = format!(r"{}\command", shell_path);
    let (command_key, _) = hkcu.create_subkey(command_path)?;
    command_key.set_value("", &command)?;

    println!("[ContextMenu] ✓ Classic menu installed");
    Ok(())
}

/**
 * Register modern context menu handler (Windows 11)
 *
 * Creates CLSID handler for Windows 11 modern context menu.
 * Uses shell32.dll as InprocServer32 (standard for context menus).
 */
fn register_modern_handler(hkcu: &RegKey, exe_path: &str, command: &str) -> Result<(), io::Error> {
    let clsid_key_path = format!(r"Software\Classes\CLSID\{}", MODERN_HANDLER_CLSID);
    let (clsid_key, _) = hkcu.create_subkey(&clsid_key_path)?;

    // Handler name
    clsid_key.set_value("", &format!("{} - Add Widget", APP_NAME))?;

    // InprocServer32 (standard shell32.dll for context menus)
    let inproc_path = format!(r"{}\InprocServer32", clsid_key_path);
    let (inproc_key, _) = hkcu.create_subkey(&inproc_path)?;
    inproc_key.set_value("", &r"%SystemRoot%\System32\shell32.dll")?;
    inproc_key.set_value("ThreadingModel", &"Apartment")?;

    // Command to execute
    let command_path = format!(r"{}\Shell\Open\Command", clsid_key_path);
    let (command_key, _) = hkcu.create_subkey(&command_path)?;
    command_key.set_value("", &command)?;

    // Icon (optional, uses shell32.dll default if not set)
    let icon_path = format!(r"{}\DefaultIcon", clsid_key_path);
    let (icon_key, _) = hkcu.create_subkey(&icon_path)?;
    icon_key.set_value("", &format!("\"{}\",0", exe_path))?;

    println!("[ContextMenu] ✓ Modern handler registered");
    Ok(())
}

/**
 * Get current executable path
 *
 * Returns absolute path to ThirdScreen.exe.
 * Used for icon and command registration.
 */
fn get_exe_path() -> String {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.to_str().map(String::from))
        .unwrap_or_else(|| {
            eprintln!("[ContextMenu] Warning: Could not determine exe path, using fallback");
            String::from("ThirdScreen.exe")
        })
}

// ============================================================================
// Tauri Commands (IPC Layer)
// ============================================================================

// End of context_menu module
// Tauri commands are defined in commands/context_menu.rs which delegates to these functions
