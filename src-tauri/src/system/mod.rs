// System Module Structure
//
// This module contains OS-level system integrations and utilities.
// These modules handle OS interactions that commands delegate to.

pub mod uptime;
pub mod window_tracker;
pub mod tray;
pub mod window_manager;
pub mod window_placement;
pub mod monitor_tracker;

#[cfg(target_os = "windows")]
pub mod windows_integration;

// Re-export commonly used functions
pub use uptime::get_system_uptime;
pub use window_tracker::get_active_window_info;
pub use tray::create_tray;
pub use window_manager::{WINDOW_MANAGER, WindowConfig, WindowType};
pub use window_placement::{WindowPlacer, WindowPlacement, PlacementResult};
pub use monitor_tracker::{MonitorTracker, MonitorEvent, init_monitor_tracking};
