// Commands Module Structure
//
// This module defines all Tauri IPC command handlers.
// Commands are thin wrappers that delegate to system/domain modules.
// Each submodule represents a focused command domain.

pub mod desktop_widgets;
pub mod metrics;
pub mod monitors;
pub mod network;
pub mod persistence;
pub mod sensors;
pub mod settings;
pub mod widget_actions;
pub mod windows;

// Re-export all command functions for easy registration
pub use desktop_widgets::{
    close_desktop_widget, get_desktop_widgets, spawn_desktop_widget, update_widget_position,
    update_widget_size,
};
pub use metrics::get_system_metrics;
pub use monitors::get_monitors;
pub use network::get_network_stats;
pub use sensors::get_system_temps;
pub use settings::{load_settings, save_settings};
pub use windows::{apply_fullscreen, move_to_monitor, open_system_clock, toggle_fullscreen};

pub use persistence::{
    get_schema_version, load_persisted_state, reset_persisted_state, save_persisted_state,
};
pub use widget_actions::{
    minimize_desktop_widget, restore_desktop_widget, set_widget_opacity,
    toggle_widget_always_on_top,
};

#[cfg(target_os = "windows")]
pub mod context_menu;

#[cfg(target_os = "windows")]
pub mod windows_integration;

#[cfg(target_os = "windows")]
pub use context_menu::{check_context_menu_installed, disable_context_menu, enable_context_menu};

// Re-export Windows integration commands
#[cfg(target_os = "windows")]
pub use windows_integration::{
    check_registry_keys_exist, check_startup_enabled, disable_startup, enable_startup,
    list_integration_registry_keys, toggle_startup,
};
