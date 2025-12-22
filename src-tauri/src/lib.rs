use tauri::Manager;

mod settings;
mod monitors;
mod window_controls;
mod sensors;
mod window_tracker;
mod system;
mod network;
mod metrics;

pub use settings::{load_settings, save_settings, AppSettings};
pub use monitors::{get_monitors, Monitor, MonitorPosition, MonitorSize};
pub use sensors::get_system_temps;
pub use system::get_system_uptime;
pub use window_controls::{apply_fullscreen, move_to_monitor, open_system_clock, toggle_fullscreen};
pub use window_tracker::{get_active_window_info, ActiveWindowInfo};
pub use network::get_network_stats;
pub use metrics::get_system_metrics;

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
            get_active_window_info,
            get_network_stats,
            get_system_metrics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

