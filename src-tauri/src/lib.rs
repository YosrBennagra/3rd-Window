use log::info;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::PathBuf, process::Command};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use sysinfo::System;
use tauri::{Manager, Window};

#[cfg(windows)]
use windows::core::PCWSTR;
#[cfg(windows)]
use windows::Win32::Graphics::Gdi::{
    EnumDisplayDevicesW, DISPLAY_DEVICEW, DISPLAY_DEVICE_ACTIVE, DISPLAY_DEVICE_MIRRORING_DRIVER,
};
#[cfg(windows)]
use winreg::{
    enums::{HKEY_LOCAL_MACHINE, KEY_READ},
    RegKey,
};
#[cfg(windows)]
use wmi::{COMLibrary, Variant, WMIConnection};

mod settings;
mod monitors;
mod window_controls;
mod sensors;
mod window_tracker;
mod system;

pub use settings::{load_settings, save_settings, AppSettings};
pub use monitors::{get_monitors, Monitor, MonitorPosition, MonitorSize};
pub use sensors::get_system_temps;
pub use system::get_system_uptime;
pub use window_controls::{apply_fullscreen, move_to_monitor, open_system_clock, toggle_fullscreen};
pub use window_tracker::{get_active_window_info, ActiveWindowInfo};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_settings,
            load_settings,
            toggle_fullscreen,
            apply_fullscreen,
            get_monitors,
            move_to_monitor,
            open_system_clock,
            get_system_temps,
            get_system_uptime,
            get_active_window_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

