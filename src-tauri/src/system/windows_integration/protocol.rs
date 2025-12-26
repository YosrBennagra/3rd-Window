//! Protocol Handler Validator (SOLID: Single Responsibility + Security)
//!
//! Validates and sanitizes thirdscreen:// protocol URLs.
//! Ensures only safe, expected actions are executed from protocol links.
//!
//! Design Principles:
//! - Security First: All input is validated strictly
//! - Fail Safe: Unsupported or malformed URLs fail gracefully
//! - No Arbitrary Execution: Protocol cannot execute shell commands
//! - Clear Contracts: Only specific, predefined actions allowed
//! - Logging: All protocol invocations are logged
//!
//! Supported URLs:
//! - thirdscreen://open-picker          - Open widget picker
//! - thirdscreen://add-widget/{type}    - Add specific widget to desktop
//! - thirdscreen://show-dashboard       - Show main dashboard
//!
//! Explicitly NOT supported:
//! - thirdscreen://exec/*               - No arbitrary execution
//! - thirdscreen://shell/*              - No shell commands
//! - File paths or network URLs         - Only app commands

use std::io;
use winreg::enums::*;
use winreg::RegKey;

const PROTOCOL: &str = "thirdscreen";
#[allow(dead_code)]
const APP_NAME: &str = "ThirdScreen";

/// Validate protocol registration
///
/// Checks if thirdscreen:// protocol is registered in Windows.
/// Does not modify registry, only reads.
///
/// Returns true if protocol is registered, false otherwise
pub fn validate_protocol_registration() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let protocol_path = format!("Software\\Classes\\{}", PROTOCOL);

    match hkcu.open_subkey(&protocol_path) {
        Ok(key) => {
            // Verify it has required keys
            let has_url_protocol = key.get_value::<String, _>("URL Protocol").is_ok();
            let has_command =
                hkcu.open_subkey(format!("{}\\shell\\open\\command", protocol_path)).is_ok();

            has_url_protocol && has_command
        },
        Err(_) => false,
    }
}

/// Register protocol handler
///
/// Creates registry entries for thirdscreen:// protocol.
/// Called during installation or first run.
///
/// Registry Structure:
/// ```text
/// HKCU:\Software\Classes\thirdscreen
///   @                = "URL:ThirdScreen Protocol"
///   URL Protocol     = ""
///   \DefaultIcon
///     @              = "<exe>,0"
///   \shell\open\command
///     @              = "<exe> "%1""
/// ```
///
/// Security: Protocol only launches ThirdScreen.exe with URL as argument.
/// URL validation happens in handle_protocol_url().
#[allow(dead_code)]
pub fn register_protocol() -> Result<(), io::Error> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let exe_path = get_exe_path();

    println!("[Protocol] Registering thirdscreen:// protocol...");

    let protocol_path = format!("Software\\Classes\\{}", PROTOCOL);
    let (protocol_key, _) = hkcu.create_subkey(&protocol_path)?;

    // Protocol properties
    protocol_key.set_value("", &format!("URL:{} Protocol", APP_NAME))?;
    protocol_key.set_value("URL Protocol", &"")?; // Empty string signals URL protocol

    // Default icon
    let icon_path = format!("{}\\DefaultIcon", protocol_path);
    let (icon_key, _) = hkcu.create_subkey(&icon_path)?;
    icon_key.set_value("", &format!("\"{}\",0", exe_path))?;

    // Command to execute (passes URL as %1)
    let command_path = format!("{}\\shell\\open\\command", protocol_path);
    let (command_key, _) = hkcu.create_subkey(&command_path)?;
    command_key.set_value("", &format!("\"{}\" \"%1\"", exe_path))?;

    println!("[Protocol] ✓ Protocol registered successfully");
    Ok(())
}

/// Unregister protocol handler
///
/// Removes thirdscreen:// protocol from registry.
/// Called during uninstall.
#[allow(dead_code)]
pub fn unregister_protocol() -> Result<(), io::Error> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let protocol_path = format!("Software\\Classes\\{}", PROTOCOL);

    println!("[Protocol] Unregistering thirdscreen:// protocol...");

    match hkcu.delete_subkey_all(&protocol_path) {
        Ok(_) => {
            println!("[Protocol] ✓ Protocol unregistered successfully");
            Ok(())
        },
        Err(e) if e.kind() == io::ErrorKind::NotFound => {
            println!("[Protocol] ℹ Protocol not found (already unregistered)");
            Ok(())
        },
        Err(e) => {
            eprintln!("[Protocol] ✗ Failed to unregister protocol: {}", e);
            Err(e)
        },
    }
}

/// Validate protocol URL
///
/// Checks if URL is a valid thirdscreen:// URL.
/// Returns parsed action if valid, None if invalid.
///
/// Security: This is the ONLY place where protocol URLs are validated.
/// All protocol handlers MUST call this before executing actions.
///
/// # Arguments
/// * `url` - Raw URL string from Windows
///
/// # Returns
/// Validated protocol action or None
#[allow(dead_code)]
pub fn validate_protocol_url(url: &str) -> Option<ProtocolAction> {
    // Normalize URL (remove trailing slashes, lowercase scheme)
    let url = url.trim().trim_end_matches('/');

    // Must start with thirdscreen://
    if !url.starts_with("thirdscreen://") {
        eprintln!("[Protocol] Invalid protocol: {}", url);
        return None;
    }

    // Extract action path
    let action = url.strip_prefix("thirdscreen://").unwrap_or("");

    // Parse and validate action
    match action {
        "open-picker" => {
            println!("[Protocol] ✓ Valid action: open-picker");
            Some(ProtocolAction::OpenPicker)
        },
        "show-dashboard" => {
            println!("[Protocol] ✓ Valid action: show-dashboard");
            Some(ProtocolAction::ShowDashboard)
        },
        _ if action.starts_with("add-widget/") => {
            let widget_type = action.strip_prefix("add-widget/").unwrap_or("");

            // Validate widget type (only alphanumeric + hyphen)
            if is_valid_widget_type(widget_type) {
                println!("[Protocol] ✓ Valid action: add-widget/{}", widget_type);
                Some(ProtocolAction::AddWidget(widget_type.to_string()))
            } else {
                eprintln!("[Protocol] ✗ Invalid widget type: {}", widget_type);
                None
            }
        },
        _ => {
            eprintln!("[Protocol] ✗ Unsupported action: {}", action);
            None
        },
    }
}

/// Validate widget type string
///
/// Widget types must be:
/// - Alphanumeric characters (a-z, 0-9)
/// - Hyphens (-)
/// - Length: 1-50 characters
///
/// This prevents injection attacks via widget type parameter.
#[allow(dead_code)]
fn is_valid_widget_type(widget_type: &str) -> bool {
    if widget_type.is_empty() || widget_type.len() > 50 {
        return false;
    }

    widget_type.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
}

/// Get executable path
#[allow(dead_code)]
fn get_exe_path() -> String {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.to_str().map(String::from))
        .unwrap_or_else(|| {
            eprintln!("[Protocol] Warning: Could not determine exe path");
            String::from("ThirdScreen.exe")
        })
}

/// Protocol Action
///
/// Validated actions that can be executed via protocol handler.
/// This is an explicit whitelist - only these actions are allowed.
#[derive(Debug, Clone, PartialEq, Eq)]
#[allow(dead_code)]
pub enum ProtocolAction {
    /// Open widget picker window
    OpenPicker,

    /// Show main dashboard window
    ShowDashboard,

    /// Add specific widget to desktop
    /// Widget type must be validated (alphanumeric + hyphen only)
    AddWidget(String),
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_protocol_url_valid() {
        assert_eq!(
            validate_protocol_url("thirdscreen://open-picker"),
            Some(ProtocolAction::OpenPicker)
        );

        assert_eq!(
            validate_protocol_url("thirdscreen://show-dashboard"),
            Some(ProtocolAction::ShowDashboard)
        );

        assert_eq!(
            validate_protocol_url("thirdscreen://add-widget/clock"),
            Some(ProtocolAction::AddWidget("clock".to_string()))
        );

        // Trailing slash should be stripped
        assert_eq!(
            validate_protocol_url("thirdscreen://open-picker/"),
            Some(ProtocolAction::OpenPicker)
        );
    }

    #[test]
    fn test_validate_protocol_url_invalid() {
        // Wrong protocol
        assert_eq!(validate_protocol_url("http://example.com"), None);
        assert_eq!(validate_protocol_url("javascript:alert(1)"), None);

        // Unsupported actions
        assert_eq!(validate_protocol_url("thirdscreen://exec/cmd"), None);
        assert_eq!(validate_protocol_url("thirdscreen://shell/evil"), None);

        // Invalid widget types
        assert_eq!(validate_protocol_url("thirdscreen://add-widget/../../etc/passwd"), None);
        assert_eq!(validate_protocol_url("thirdscreen://add-widget/cmd.exe"), None);
        assert_eq!(validate_protocol_url("thirdscreen://add-widget/widget;rm -rf /"), None);
    }

    #[test]
    fn test_is_valid_widget_type() {
        // Valid
        assert!(is_valid_widget_type("clock"));
        assert!(is_valid_widget_type("network-monitor"));
        assert!(is_valid_widget_type("ram"));
        assert!(is_valid_widget_type("widget-123"));

        // Invalid
        assert!(!is_valid_widget_type(""));
        assert!(!is_valid_widget_type("../../evil"));
        assert!(!is_valid_widget_type("widget;rm -rf /"));
        assert!(!is_valid_widget_type("cmd.exe"));
        assert!(!is_valid_widget_type("widget with spaces"));
        assert!(!is_valid_widget_type(&"a".repeat(51))); // Too long
    }
}
