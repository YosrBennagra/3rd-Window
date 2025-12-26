// System Module Structure
//
// This module contains OS-level system integrations and utilities.
// These modules handle OS interactions that commands delegate to.

pub mod monitor_tracker;
pub mod tray;
pub mod uptime;
pub mod window_manager;
pub mod window_placement;
pub mod window_tracker;

#[cfg(target_os = "windows")]
pub mod windows_integration;

// Re-export commonly used functions
pub use monitor_tracker::init_monitor_tracking;
pub use tray::create_tray;
pub use uptime::get_system_uptime;
pub use window_manager::{WindowConfig, WindowType, WINDOW_MANAGER};
pub use window_tracker::get_active_window_info;
