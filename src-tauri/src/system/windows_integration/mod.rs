/**
 * Windows OS Integration Module (SOLID: Single Responsibility)
 * 
 * This module provides safe, intentional, and reversible Windows OS integration.
 * All Windows-specific behavior is isolated here for maintainability and security.
 * 
 * Design Principles (from os-integration-windows skill):
 * 1. Principle of Least Surprise - Behavior matches user expectations
 * 2. Principle of Least Privilege - Only required OS features are used
 * 3. Reversibility - All changes can be undone
 * 4. Security First - Validation, minimal privilege, no arbitrary execution
 * 5. User Control - Explicit consent, easy disable/uninstall
 * 
 * Responsibilities:
 * - System tray icon and menu management
 * - Context menu integration (classic + Windows 11)
 * - Protocol handler registration (thirdscreen://)
 * - Registry access (read/write with validation)
 * - Startup behavior management
 * - Cleanup on uninstall
 */

pub mod context_menu;
pub mod protocol;
pub mod registry_utils;
pub mod startup;
pub mod tray_menu;

use std::io;
use tauri::{AppHandle, Runtime};

/**
 * Initialize all Windows OS integrations
 * 
 * Called once during application startup.
 * Creates system tray, registers protocols, checks startup settings.
 * 
 * @param app - Tauri application handle
 * @returns Result indicating success or error
 */
#[allow(dead_code)]
pub fn initialize_windows_integration<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    println!("[Windows Integration] Initializing...");
    
    // Initialize system tray
    tray_menu::create_system_tray(app)?;
    println!("[Windows Integration] ✓ System tray created");
    
    // Protocol handler is registered via tauri_plugin_deep_link
    // We just validate it's available
    if protocol::validate_protocol_registration() {
        println!("[Windows Integration] ✓ Protocol handler validated");
    } else {
        eprintln!("[Windows Integration] ⚠ Protocol handler not registered properly");
    }
    
    // Check if startup is enabled (don't auto-enable)
    if startup::is_startup_enabled() {
        println!("[Windows Integration] ℹ Startup is enabled");
    }
    
    println!("[Windows Integration] Initialization complete");
    Ok(())
}

/**
 * Cleanup Windows OS integrations
 * 
 * Called during application shutdown or uninstall.
 * Removes context menu, disables startup, cleans registry.
 * 
 * @param keep_settings - If true, keep user preferences (only remove integration)
 * @returns Result indicating success or error
 */
#[allow(dead_code)]
pub fn cleanup_windows_integration(keep_settings: bool) -> Result<(), io::Error> {
    println!("[Windows Integration] Cleaning up...");
    
    // Remove context menu integration
    if context_menu::is_installed() {
        context_menu::uninstall()?;
        println!("[Windows Integration] ✓ Context menu removed");
    }
    
    // Disable startup if enabled
    if startup::is_startup_enabled() {
        startup::disable()?;
        println!("[Windows Integration] ✓ Startup disabled");
    }
    
    // Protocol handler cleanup
    // Note: We don't unregister the protocol on cleanup unless uninstalling
    // because it's managed by the installer/uninstaller
    
    if !keep_settings {
        // Full uninstall - remove all traces
        println!("[Windows Integration] ℹ Full uninstall - removing all registry keys");
        registry_utils::cleanup_all_registry_keys()?;
    }
    
    println!("[Windows Integration] Cleanup complete");
    Ok(())
}

/**
 * Get Windows integration status
 * 
 * Returns current state of all Windows integrations.
 * Useful for settings UI to show what's enabled.
 */
#[allow(dead_code)]
pub fn get_integration_status() -> IntegrationStatus {
    IntegrationStatus {
        context_menu_installed: context_menu::is_installed(),
        startup_enabled: startup::is_startup_enabled(),
        protocol_registered: protocol::validate_protocol_registration(),
        tray_icon_active: true, // Always active when app is running
    }
}

/**
 * Windows Integration Status
 * 
 * Reflects current state of OS integrations.
 */
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct IntegrationStatus {
    pub context_menu_installed: bool,
    pub startup_enabled: bool,
    pub protocol_registered: bool,
    pub tray_icon_active: bool,
}
