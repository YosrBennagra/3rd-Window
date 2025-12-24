/**
 * ThirdScreen - Tauri v2 Architecture (Production-Grade)
 *
 * This module serves as the main entry point and integration layer.
 * It wires together commands, system modules, and IPC contracts.
 *
 * Architecture Principles:
 * - Thin Integration Layer: main.rs orchestrates, doesn't implement logic
 * - Explicit IPC Contracts: All types defined in ipc_types module
 * - One Responsibility per Module: Commands, system, and IPC separated
 * - Clear Command Ownership: Each command has single, clear purpose
 * - Security First: Minimal, scoped OS access
 */

// Module declarations
mod commands;
mod error;
mod system;
mod ipc_types;
mod validation;
mod persistence;
mod uninstaller;

// Re-export IPC types for external use
pub use ipc_types::{
    AppSettings, Monitor, MonitorPosition, MonitorSize, WidgetWindowConfig, SystemMetrics,
    NetworkStats, ActiveWindowInfo,
};

// Re-export persistence types
pub use persistence::{PersistedState, RecoveryMode};

// Re-export command functions for invoke_handler registration
pub use commands::{
    // Window control commands
    apply_fullscreen,
    move_to_monitor,
    open_system_clock,
    toggle_fullscreen,
    // Monitor commands
    get_monitors,
    // Settings commands
    load_settings,
    save_settings,
    // Sensor commands
    get_system_temps,
    // Network commands
    get_network_stats,
    // Metrics commands
    get_system_metrics,
    // Desktop widget commands
    close_desktop_widget,
    get_desktop_widgets,
    spawn_desktop_widget,
    update_widget_position,
    update_widget_size,
    // Widget action commands
    minimize_desktop_widget,
    restore_desktop_widget,
    toggle_widget_always_on_top,
    set_widget_opacity,
    // Persistence commands
    load_persisted_state,
    save_persisted_state,
    reset_persisted_state,
    get_schema_version,
};

#[cfg(target_os = "windows")]
pub use commands::{
    check_context_menu_installed,
    disable_context_menu,
    enable_context_menu,
    enable_startup,
    disable_startup,
    check_startup_enabled,
    toggle_startup,
    list_integration_registry_keys,
    check_registry_keys_exist,
};

// Re-export uninstaller functions
pub use uninstaller::{
    check_active_integrations,
    list_integrations,
    uninstall_cleanup,
};

// Re-export system utilities that commands delegate to
pub use system::{create_tray, get_active_window_info, get_system_uptime, init_monitor_tracking};

use tauri::{AppHandle, Runtime, Url};
use uuid::Uuid;

/**
 * Deep Link Handler
 *
 * Handles thirdscreen:// protocol URLs for widget spawning and commands.
 * Delegates to appropriate command handlers instead of implementing logic here.
 */
fn handle_deep_link<R: Runtime>(app: &AppHandle<R>, urls: Vec<Url>) {
    println!("[DEEP_LINK] Handler called with {} URLs", urls.len());

    for url in urls {
        let url_str = url.to_string();
        println!("[DEEP_LINK] Processing URL: '{}'", url_str);

        // Handle open-picker command (from context menu)
        if url_str == "thirdscreen://open-picker" || url_str == "thirdscreen://open-picker/" {
            println!("[DEEP_LINK] ✓ Matched open-picker command");
            open_widget_picker_desktop_mode(app);
            continue;
        }

        // Parse deep link: thirdscreen://add-widget/clock
        if let Some(widget_type) = url_str.strip_prefix("thirdscreen://add-widget/") {
            println!("[DEEP_LINK] Spawning widget: {}", widget_type);

            let widget_id = Uuid::new_v4().to_string();

            // Determine default size based on widget type
            let (width, height) = match widget_type {
                "clock" => (300, 150),
                "temperature" => (250, 180),
                "ram" => (280, 160),
                "disk" => (280, 160),
                "network-monitor" => (320, 200),
                _ => (250, 150),
            };

            let config = WidgetWindowConfig {
                widget_id: widget_id.clone(),
                widget_type: widget_type.to_string(),
                x: 100,
                y: 100,
                width,
                height,
                monitor_index: None,
            };

            // Spawn widget asynchronously
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                match spawn_desktop_widget(app_handle, config).await {
                    Ok(id) => println!("[DEEP_LINK] Widget spawned successfully: {}", id),
                    Err(e) => eprintln!("[DEEP_LINK] Failed to spawn widget: {}", e),
                }
            });
        } else {
            println!("[DEEP_LINK] Unknown deep link format: {}", url_str);
        }
    }
}

/**
 * Open Widget Picker in Desktop Mode
 *
 * Creates a widget picker window for desktop widget selection.
 * Uses centralized WindowManager for predictable lifecycle management.
 */
fn open_widget_picker_desktop_mode<R: Runtime>(app: &AppHandle<R>) {
    use crate::system::{WINDOW_MANAGER, WindowConfig};

    println!("[PICKER] Opening widget picker in desktop mode");

    let config = WindowConfig::widget_picker();
    
    match WINDOW_MANAGER.create_window(app, config) {
        Ok(_window) => {
            println!("[PICKER] ✓ Widget picker window created successfully");
        }
        Err(e) => {
            eprintln!("[PICKER] ✗ Failed to create widget picker window: {}", e);
        }
    }
}

/**
 * Application Entry Point
 *
 * Wires together Tauri plugins, system tray, deep link handlers, and IPC commands.
 * This function orchestrates - it does not contain business logic.
 */
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Register Tauri plugins
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        // Setup hook for initialization
        .setup(|app| {
            // Initialize logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize system tray
            system::create_tray(&app.handle())?;

            // Register deep link protocol handler
            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                
                println!("[SETUP] Initializing deep link handler");
                let app_handle = app.handle().clone();

                // Register the protocol
                println!("[SETUP] Registering deep link protocol: thirdscreen://");
                match app.handle().deep_link().register_all() {
                    Ok(_) => println!("[SETUP] ✓ Deep link protocol registered"),
                    Err(e) => eprintln!("[SETUP] ✗ Failed to register deep link: {}", e),
                }

                // Listen for deep link events
                println!("[SETUP] Setting up deep link event listener");
                app.handle().deep_link().on_open_url(move |event| {
                    let urls = event.urls();
                    println!("[EVENT] Deep link event triggered!");
                    println!("[EVENT] Received {} URL(s)", urls.len());
                    for (i, url) in urls.iter().enumerate() {
                        println!("[EVENT] URL[{}]: {}", i, url);
                    }
                    handle_deep_link(&app_handle, urls);
                });
                println!("[SETUP] ✓ Deep link listener registered");
                // Initialize monitor hot-plug tracking
                println!("[SETUP] Initializing monitor tracking");
                init_monitor_tracking(&app.handle());
                println!("[SETUP] ✓ Monitor tracking started");            }

            Ok(())
        })
        // Register all IPC command handlers
        .invoke_handler(tauri::generate_handler![
            // Settings commands
            save_settings,
            load_settings,
            // Persistence commands
            load_persisted_state,
            save_persisted_state,
            reset_persisted_state,
            get_schema_version,
            // Window control commands
            toggle_fullscreen,
            apply_fullscreen,
            move_to_monitor,
            open_system_clock,
            // Monitor commands
            get_monitors,
            // Sensor commands
            get_system_temps,
            // System commands
            get_system_uptime,
            get_active_window_info,
            // Network commands
            get_network_stats,
            // Metrics commands
            get_system_metrics,
            // Desktop widget commands
            spawn_desktop_widget,
            close_desktop_widget,
            update_widget_position,
            update_widget_size,
            get_desktop_widgets,
            // Widget action commands
            minimize_desktop_widget,
            restore_desktop_widget,
            toggle_widget_always_on_top,
            set_widget_opacity,
            // Windows-specific commands
            #[cfg(target_os = "windows")]
            enable_context_menu,
            #[cfg(target_os = "windows")]
            disable_context_menu,
            #[cfg(target_os = "windows")]
            check_context_menu_installed,
            // Windows startup commands
            #[cfg(target_os = "windows")]
            enable_startup,
            #[cfg(target_os = "windows")]
            disable_startup,
            #[cfg(target_os = "windows")]
            check_startup_enabled,
            #[cfg(target_os = "windows")]
            toggle_startup,
            // Windows registry utilities
            #[cfg(target_os = "windows")]
            list_integration_registry_keys,
            #[cfg(target_os = "windows")]
            check_registry_keys_exist,
            // Uninstaller commands
            #[cfg(target_os = "windows")]
            uninstall_cleanup,
            #[cfg(target_os = "windows")]
            check_active_integrations,
            #[cfg(target_os = "windows")]
            list_integrations
        ])
        .run(tauri::generate_context!())
        .map_err(|e| eprintln!("Failed to start application: {}", e))
        .ok();
}

