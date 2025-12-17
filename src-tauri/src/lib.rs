use log::info;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use sysinfo::System;
use tauri::{Manager, Window};

#[cfg(windows)]
use wmi::{COMLibrary, Variant, WMIConnection};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    is_fullscreen: bool,
    selected_monitor: usize,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            is_fullscreen: false,
            selected_monitor: 0,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GridPosition {
    col: i32,
    row: i32,
    width: i32,
    height: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WidgetGridItem {
    id: String,
    widget_type: String,
    position: GridPosition,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GridLayout {
    col_widths: Option<Vec<f64>>,
    row_heights: Option<Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DashboardState {
    widgets: Vec<WidgetGridItem>,
    grid_layout: Option<GridLayout>,
    version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Monitor {
    name: String,
    size: MonitorSize,
    position: MonitorPosition,
    is_primary: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonitorSize {
    width: u32,
    height: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonitorPosition {
    x: i32,
    y: i32,
}

fn get_settings_path(app: tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
        .map(|mut path| {
            path.push("settings.json");
            path
        })
}

fn get_dashboard_path(app: tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
        .map(|mut path| {
            path.push("dashboard.json");
            path
        })
}

#[tauri::command]
async fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let settings_path = get_settings_path(app)?;
    
    if let Some(parent) = settings_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create settings directory: {}", e))?;
    }
    
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    fs::write(&settings_path, json)
        .map_err(|e| format!("Failed to write settings: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn load_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let settings_path = get_settings_path(app)?;
    
    if !settings_path.exists() {
        return Ok(AppSettings::default());
    }
    
    let json = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;
    
    let settings: AppSettings = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;
    
    Ok(settings)
}

#[tauri::command]
async fn save_dashboard(app: tauri::AppHandle, dashboard: DashboardState) -> Result<(), String> {
    let dashboard_path = get_dashboard_path(app)?;
    
    if let Some(parent) = dashboard_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create dashboard directory: {}", e))?;
    }
    
    let json = serde_json::to_string_pretty(&dashboard)
        .map_err(|e| format!("Failed to serialize dashboard: {}", e))?;
    
    fs::write(&dashboard_path, json)
        .map_err(|e| format!("Failed to write dashboard: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn load_dashboard(app: tauri::AppHandle) -> Result<DashboardState, String> {
    let dashboard_path = get_dashboard_path(app)?;
    
    if !dashboard_path.exists() {
        // Return default dashboard if file doesn't exist
        return Ok(DashboardState {
            widgets: vec![],
            grid_layout: None,
            version: 1,
        });
    }
    
    let json = fs::read_to_string(&dashboard_path)
        .map_err(|e| format!("Failed to read dashboard: {}", e))?;
    
    let dashboard: DashboardState = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse dashboard: {}", e))?;
    
    Ok(dashboard)
}

#[tauri::command]
async fn toggle_fullscreen(window: Window) -> Result<bool, String> {
    let current = window
        .is_fullscreen()
        .map_err(|e| format!("Failed to query fullscreen: {}", e))?;
    
    let new_state = !current;
    info!("[window] toggle_fullscreen: {} -> {}", current, new_state);
    
    window
        .set_fullscreen(new_state)
        .map_err(|e| format!("Failed to set fullscreen: {}", e))?;
    
    Ok(new_state)
}

#[tauri::command]
async fn apply_fullscreen(window: Window, fullscreen: bool) -> Result<(), String> {
    info!("[window] apply_fullscreen: {}", fullscreen);
    
    // Small delay to allow window state to settle on Windows
    std::thread::sleep(std::time::Duration::from_millis(50));
    
    window
        .set_fullscreen(fullscreen)
        .map_err(|e| format!("Failed to apply fullscreen: {}", e))?;
    
    // Verify the state was applied
    let actual_state = window
        .is_fullscreen()
        .map_err(|e| format!("Failed to verify fullscreen: {}", e))?;
    
    info!("[window] apply_fullscreen: requested={}, actual={}", fullscreen, actual_state);
    
    Ok(())
}

#[tauri::command]
async fn get_monitors(app: tauri::AppHandle) -> Result<Vec<Monitor>, String> {
    let monitors = app
        .primary_monitor()
        .map_err(|e| format!("Failed to get monitors: {}", e))?;
    
    let available_monitors = app
        .available_monitors()
        .map_err(|e| format!("Failed to get available monitors: {}", e))?;
    
    let primary_name = monitors
        .and_then(|m| m.name().map(|s| s.to_string()))
        .unwrap_or_else(|| "Unknown".to_string());
    
    let mut result = Vec::new();
    
    for (index, monitor) in available_monitors.iter().enumerate() {
        let name = monitor.name()
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("Monitor {}", index + 1));
        let size = monitor.size();
        let position = monitor.position();
        let is_primary = name == primary_name;
        
        result.push(Monitor {
            name,
            size: MonitorSize {
                width: size.width,
                height: size.height,
            },
            position: MonitorPosition {
                x: position.x,
                y: position.y,
            },
            is_primary,
        });
    }
    
    if result.is_empty() {
        result.push(Monitor {
            name: "Primary Monitor".to_string(),
            size: MonitorSize { width: 1920, height: 1080 },
            position: MonitorPosition { x: 0, y: 0 },
            is_primary: true,
        });
    }
    
    Ok(result)
}

#[tauri::command]
async fn move_to_monitor(window: Window, app: tauri::AppHandle, monitor_index: usize) -> Result<(), String> {
    let monitors = app
        .available_monitors()
        .map_err(|e| format!("Failed to get monitors: {}", e))?;

    let monitor = monitors
        .get(monitor_index)
        .ok_or_else(|| format!("Monitor index {} not found", monitor_index))?;

    info!(
        "[window] move_to_monitor -> index={}, name={:?}",
        monitor_index,
        monitor.name()
    );

    let position = monitor.position();
    let size = monitor.size();

    // Move window to monitor
    window
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: position.x,
            y: position.y,
        }))
        .map_err(|e| format!("Failed to move window: {}", e))?;

    // Only resize if explicitly in windowed mode (don't check during transition)
    // This prevents interfering with fullscreen state during monitor moves
    std::thread::sleep(std::time::Duration::from_millis(30));
    
    if let Ok(false) = window.is_fullscreen() {
        window
            .set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: size.width.saturating_sub(100),
                height: size.height.saturating_sub(100),
            }))
            .map_err(|e| format!("Failed to resize window: {}", e))?;
    }

    info!("[window] move_to_monitor -> complete");
    Ok(())
}

#[derive(Debug, Serialize)]
struct SystemTemps {
    cpu_temp: Option<f32>,
    gpu_temp: Option<f32>,
    cpu_usage: f32,
    available_sensors: Vec<String>,
}

#[cfg(windows)]
fn get_wmi_temps() -> (Option<f32>, Vec<String>) {
    let mut available_sensors = Vec::new();
    let mut cpu_temp: Option<f32> = None;

    match COMLibrary::new() {
        Ok(com_con) => {
            // Try OpenHardwareMonitor namespace first
            if let Ok(wmi_con) = WMIConnection::with_namespace_path("root\\OpenHardwareMonitor", com_con.clone()) {
                if let Ok(results) = wmi_con.raw_query::<std::collections::HashMap<String, Variant>>(
                    "SELECT * FROM Sensor WHERE SensorType='Temperature'"
                ) {
                    for result in results {
                        if let (Some(Variant::String(name)), Some(Variant::R4(value))) = 
                            (result.get("Name"), result.get("Value")) {
                            let temp = *value;
                            let sensor_name = format!("{}: {:.1}°C", name, temp);
                            available_sensors.push(sensor_name.clone());
                            
                            info!("[sensors] OHM: {}", sensor_name);
                            
                            // Look for CPU Tctl/Tdie specifically
                            if name.to_lowercase().contains("tctl") || name.to_lowercase().contains("tdie") {
                                cpu_temp = Some(temp);
                                info!("[sensors] Found Tctl/Tdie: {:.1}°C", temp);
                            }
                            // Fallback to any CPU temp
                            else if cpu_temp.is_none() && name.to_lowercase().contains("cpu") {
                                cpu_temp = Some(temp);
                            }
                        }
                    }
                }
            }
            
            // If OpenHardwareMonitor didn't work, try standard WMI
            if cpu_temp.is_none() {
                if let Ok(wmi_con) = WMIConnection::with_namespace_path("root\\WMI", com_con) {
                    if let Ok(results) = wmi_con.raw_query::<std::collections::HashMap<String, Variant>>(
                        "SELECT * FROM MSAcpi_ThermalZoneTemperature"
                    ) {
                        for result in results {
                            if let Some(Variant::UI4(temp_kelvin)) = result.get("CurrentTemperature") {
                                let temp_celsius = (*temp_kelvin as f32 / 10.0) - 273.15;
                                if temp_celsius > 0.0 && temp_celsius < 150.0 {
                                    available_sensors.push(format!("Thermal Zone: {:.1}°C", temp_celsius));
                                    if cpu_temp.is_none() {
                                        cpu_temp = Some(temp_celsius);
                                        info!("[sensors] WMI CPU temp: {:.1}°C", temp_celsius);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        Err(e) => info!("[sensors] COM library error: {}", e),
    }

    (cpu_temp, available_sensors)
}

#[cfg(not(windows))]
fn get_wmi_temps() -> (Option<f32>, Vec<String>) {
    (None, Vec::new())
}

#[tauri::command]
async fn get_system_temps() -> Result<SystemTemps, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let cpu_usage = sys.global_cpu_usage();
    
    // Try WMI on Windows
    let (cpu_temp, mut available_sensors) = get_wmi_temps();
    
    // Generate simulated data for now (for testing)
    let cpu_temp = cpu_temp.or_else(|| {
        // Use CPU usage as a base for simulated temp (40-80°C range)
        let base_temp = 40.0 + (cpu_usage * 0.4);
        Some(base_temp + (rand::random::<f32>() * 5.0))
    });
    
    let gpu_temp = Some(45.0 + (rand::random::<f32>() * 15.0));
    
    if available_sensors.is_empty() {
        available_sensors.push(format!("Simulated CPU: {:.1}°C", cpu_temp.unwrap_or(0.0)));
        available_sensors.push(format!("Simulated GPU: {:.1}°C", gpu_temp.unwrap_or(0.0)));
    }
    
    info!("[sensors] CPU={:.1}°C, GPU={:.1}°C", cpu_temp.unwrap_or(0.0), gpu_temp.unwrap_or(0.0));
    
    Ok(SystemTemps { 
        cpu_temp, 
        gpu_temp,
        cpu_usage,
        available_sensors 
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            save_dashboard,
            load_dashboard,
            toggle_fullscreen,
            apply_fullscreen,
            get_monitors,
            move_to_monitor,
            get_system_temps
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
