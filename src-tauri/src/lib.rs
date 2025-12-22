mod settings;
mod monitors;
mod window_controls;
mod sensors;
mod window_tracker;
mod system;
mod network;
mod metrics;
mod widget_windows;
mod tray;

#[cfg(target_os = "windows")]
mod context_menu;

pub use settings::{load_settings, save_settings, AppSettings};
pub use monitors::{get_monitors, Monitor, MonitorPosition, MonitorSize};
pub use sensors::get_system_temps;
pub use system::get_system_uptime;
pub use window_controls::{apply_fullscreen, move_to_monitor, open_system_clock, toggle_fullscreen};
pub use window_tracker::{get_active_window_info, ActiveWindowInfo};
pub use network::get_network_stats;
pub use metrics::get_system_metrics;
pub use widget_windows::{spawn_desktop_widget, close_desktop_widget, update_widget_position, update_widget_size, get_desktop_widgets};

#[cfg(target_os = "windows")]
pub use context_menu::{enable_context_menu, disable_context_menu, check_context_menu_installed};

use tauri::{AppHandle, Runtime, Url};
use widget_windows::WidgetWindowConfig;
use uuid::Uuid;

fn handle_deep_link<R: Runtime>(app: &AppHandle<R>, urls: Vec<Url>) {
    println!("[DEEP_LINK] Handler called with {} URLs", urls.len());
    
    for url in urls {
        let url_str = url.to_string();
        println!("[DEEP_LINK] Processing URL: '{}'", url_str);
        
        // Handle open-picker command (from context menu)
        if url_str == "thirdscreen://open-picker" || url_str == "thirdscreen://open-picker/" {
            println!("[DEEP_LINK] ✓ Matched open-picker command");
            println!("[DEEP_LINK] Calling open_widget_picker_desktop_mode...");
            open_widget_picker_desktop_mode(app);
            println!("[DEEP_LINK] open_widget_picker_desktop_mode returned");
            continue;
        }
        
        // Parse deep link: thirdscreen://add-widget/clock
        if let Some(widget_type) = url_str.strip_prefix("thirdscreen://add-widget/") {
            println!("Spawning widget: {}", widget_type);
            
            let widget_id = Uuid::new_v4().to_string();
            
            let config = WidgetWindowConfig {
                widget_id: widget_id.clone(),
                widget_type: widget_type.to_string(),
                x: 100,
                y: 100,
                width: match widget_type {
                    "clock" => 300,
                    "temperature" => 250,
                    "ram" => 280,
                    "disk" => 280,
                    "network-monitor" => 320,
                    _ => 250,
                },
                height: match widget_type {
                    "clock" => 150,
                    "temperature" => 180,
                    "ram" => 160,
                    "disk" => 160,
                    "network-monitor" => 200,
                    _ => 150,
                },
                monitor_index: None,
            };
            
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                match spawn_desktop_widget(app_handle, config).await {
                    Ok(id) => println!("Widget spawned successfully: {}", id),
                    Err(e) => eprintln!("Failed to spawn widget from deep link: {}", e),
                }
            });
        } else {
            println!("Unknown deep link format: {}", url_str);
        }
    }
}

fn open_widget_picker_desktop_mode<R: Runtime>(app: &AppHandle<R>) {
    use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
    
    println!("[PICKER] open_widget_picker_desktop_mode called");
    
    let label = "widget-picker";
    
    // Check if picker already exists
    if let Some(window) = app.get_webview_window(label) {
        println!("[PICKER] Window already exists, showing and focusing");
        if let Err(e) = window.show() {
            eprintln!("[PICKER] Error showing window: {}", e);
        }
        if let Err(e) = window.set_focus() {
            eprintln!("[PICKER] Error focusing window: {}", e);
        }
        return;
    }
    
    println!("[PICKER] Creating new widget-picker window");
    println!("[PICKER] URL: /#/widget-picker?mode=desktop");
    
    // Create widget picker window with desktop mode parameter
    match WebviewWindowBuilder::new(
        app,
        label,
        WebviewUrl::App("/#/widget-picker?mode=desktop".into())
    )
    .title("Add Widget")
    .inner_size(520.0, 480.0)
    .resizable(false)
    .center()
    .always_on_top(true)
    .visible(true)
    .build() {
        Ok(window) => {
            println!("[PICKER] ✓ Window created successfully");
            println!("[PICKER] Window label: {}", window.label());
        }
        Err(e) => {
            eprintln!("[PICKER] ✗ Failed to create window: {}", e);
        }
    }
}

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
            
            // Initialize system tray
            tray::create_tray(&app.handle())?;
            
            // Handle deep links for widget spawning using deep-link plugin
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
            get_system_metrics,
            spawn_desktop_widget,
            close_desktop_widget,
            update_widget_position,
            update_widget_size,
            get_desktop_widgets,
            #[cfg(target_os = "windows")]
            enable_context_menu,
            #[cfg(target_os = "windows")]
            disable_context_menu,
            #[cfg(target_os = "windows")]
            check_context_menu_installed
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

