use std::io;
use winreg::enums::*;
use winreg::RegKey;

const APP_NAME: &str = "ThirdScreen";
const PROTOCOL: &str = "thirdscreen";
const MODERN_HANDLER_CLSID: &str = "{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}";
const MODERN_HANDLER_KEY: &str =
    r"Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}";

/// Install context menu items to Windows registry
pub fn install_context_menu() -> Result<(), io::Error> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // First, ensure the protocol is registered
    register_protocol(&hkcu)?;

    let command = build_picker_command();
    install_classic_menu(&hkcu, &command)?;
    register_modern_menu(&hkcu, &command)?;

    Ok(())
}

/// Remove context menu items from Windows registry
pub fn uninstall_context_menu() -> Result<(), io::Error> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // Remove all ThirdScreen context menu entries
    let shell_path = r"Software\Classes\DesktopBackground\Shell";
    if let Ok(shell_key) = hkcu.open_subkey_with_flags(shell_path, KEY_WRITE) {
        let _ = shell_key.delete_subkey_all("ThirdScreen");
    }

    let _ = hkcu.delete_subkey_all(MODERN_HANDLER_KEY);

    // Remove protocol registration
    let _ = hkcu.delete_subkey_all(&format!("Software\\Classes\\{}", PROTOCOL));

    Ok(())
}

fn install_classic_menu(hkcu: &RegKey, command: &str) -> Result<(), io::Error> {
    let shell_path = r"Software\Classes\DesktopBackground\Shell\ThirdScreen";
    let (shell_key, _) = hkcu.create_subkey(shell_path)?;
    shell_key.set_value("", &menu_label())?;
    shell_key.set_value("Icon", &get_exe_path())?;
    shell_key.set_value("ExplorerCommandHandler", &MODERN_HANDLER_CLSID)?;
    shell_key.set_value("Position", &"Top")?;

    let command_path = format!(r"{}\command", shell_path);
    let (command_key, _) = hkcu.create_subkey(command_path)?;
    command_key.set_value("", &command)?;

    Ok(())
}

fn register_modern_menu(hkcu: &RegKey, command: &str) -> Result<(), io::Error> {
    let (clsid_key, _) = hkcu.create_subkey(MODERN_HANDLER_KEY)?;
    clsid_key.set_value("", &menu_label())?;

    let (inproc_key, _) = hkcu.create_subkey(format!(r"{}\InprocServer32", MODERN_HANDLER_KEY))?;
    inproc_key.set_value("", &r"%SystemRoot%\System32\shell32.dll")?;
    inproc_key.set_value("ThreadingModel", &"Apartment")?;

    let (command_key, _) =
        hkcu.create_subkey(format!(r"{}\Shell\Open\Command", MODERN_HANDLER_KEY))?;
    command_key.set_value("", &command)?;

    Ok(())
}

fn build_picker_command() -> String {
    format!("\"{}\" \"{}://open-picker\"", get_exe_path(), PROTOCOL)
}

fn menu_label() -> String {
    format!("{} - Add Widget", APP_NAME)
}


fn get_exe_path() -> String {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.to_str().map(String::from))
        .unwrap_or_else(|| String::from("ThirdScreen.exe"))
}

/// Register the custom protocol handler in Windows registry
fn register_protocol(hkcu: &RegKey) -> Result<(), io::Error> {
    let protocol_path = format!("Software\\Classes\\{}", PROTOCOL);
    let (protocol_key, _) = hkcu.create_subkey(&protocol_path)?;
    
    // Set protocol properties
    protocol_key.set_value("", &format!("URL:{} Protocol", APP_NAME))?;
    protocol_key.set_value("URL Protocol", &"")?;
    
    // Set default icon
    let (icon_key, _) = hkcu.create_subkey(format!("{}\\DefaultIcon", protocol_path))?;
    icon_key.set_value("", &format!("\"{}\",0", get_exe_path()))?;
    
    // Set command to execute
    let command_path = format!("{}\\shell\\open\\command", protocol_path);
    let (command_key, _) = hkcu.create_subkey(&command_path)?;
    command_key.set_value("", &format!("\"{}\" \"%1\"", get_exe_path()))?;
    
    Ok(())
}

#[tauri::command]
pub async fn enable_context_menu() -> Result<(), String> {
    install_context_menu()
        .map_err(|e| format!("Failed to install context menu: {}", e))
}

#[tauri::command]
pub async fn disable_context_menu() -> Result<(), String> {
    uninstall_context_menu()
        .map_err(|e| format!("Failed to uninstall context menu: {}", e))
}

#[tauri::command]
pub fn check_context_menu_installed() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let shell_path = r"Software\Classes\DesktopBackground\Shell\ThirdScreen";
    hkcu.open_subkey(shell_path).is_ok()
}
