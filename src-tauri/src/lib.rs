use log::info;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::PathBuf, process::Command};
use sysinfo::System;
use tauri::{Manager, Window};

mod layout;
use layout::{LayoutOperation, LayoutService, LayoutState};

const GRID_COLUMNS: u8 = 24;
const GRID_ROWS: u8 = 12;

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
pub struct Monitor {
    identifier: Option<String>,
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

const GENERIC_PNP_MONITOR: &str = "GENERIC PNP MONITOR";

#[cfg(windows)]
fn parse_edid_display_name(edid: &[u8]) -> Option<String> {
    if edid.len() < 128 {
        return None;
    }

    for block_index in 0..4 {
        let start = 54 + block_index * 18;
        let end = start + 18;
        if end > edid.len() {
            break;
        }

        let block = &edid[start..end];
        if block[0..3] != [0x00, 0x00, 0x00] || block[3] != 0xFC {
            continue;
        }

        let raw_text = &block[5..18];
        let mut name = String::new();
        for &byte in raw_text {
            if byte == 0x00 || byte == 0x0A || byte == 0x0D {
                break;
            }
            name.push(byte as char);
        }

        let trimmed = name.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }

    None
}

#[cfg(windows)]
fn collect_edid_names() -> HashMap<String, String> {
    let mut map = HashMap::new();
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

    if let Ok(display_root) =
        hklm.open_subkey_with_flags("SYSTEM\\CurrentControlSet\\Enum\\DISPLAY", KEY_READ)
    {
        for manufacturer in display_root.enum_keys().flatten() {
            if let Ok(manufacturer_key) =
                display_root.open_subkey_with_flags(&manufacturer, KEY_READ)
            {
                for model in manufacturer_key.enum_keys().flatten() {
                    if let Ok(model_key) = manufacturer_key.open_subkey_with_flags(&model, KEY_READ)
                    {
                        let mut hardware_ids: Vec<String> =
                            model_key.get_value("HardwareID").unwrap_or_default();

                        let edid_name = model_key
                            .open_subkey_with_flags("Device Parameters", KEY_READ)
                            .ok()
                            .and_then(|device_params| device_params.get_raw_value("EDID").ok())
                            .and_then(|edid| parse_edid_display_name(&edid.bytes));

                        if let Some(name) = edid_name
                            .filter(|value| !value.eq_ignore_ascii_case(GENERIC_PNP_MONITOR))
                        {
                            if hardware_ids.is_empty() {
                                hardware_ids.push(format!(
                                    "DISPLAY\\{}",
                                    manufacturer.to_ascii_uppercase()
                                ));
                                hardware_ids.push(format!(
                                    "MONITOR\\{}",
                                    manufacturer.to_ascii_uppercase()
                                ));
                            }

                            for id in hardware_ids {
                                let normalized = id.trim().to_ascii_uppercase();
                                if normalized.is_empty() {
                                    continue;
                                }

                                map.entry(normalized.clone())
                                    .or_insert_with(|| name.clone());
                            }
                        }
                    }
                }
            }
        }
    }

    map
}

fn extract_display_identifier(value: &str) -> Option<String> {
    let upper = value.to_ascii_uppercase();
    if let Some(pos) = upper.find("DISPLAY") {
        let remainder = &upper[pos + "DISPLAY".len()..];
        let digits: String = remainder
            .chars()
            .skip_while(|c| !c.is_ascii_digit())
            .take_while(|c| c.is_ascii_digit())
            .collect();
        if digits.is_empty() {
            None
        } else {
            Some(format!("DISPLAY{}", digits))
        }
    } else {
        None
    }
}

fn is_raw_display_identifier(value: &str) -> bool {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return false;
    }

    let upper = trimmed.to_ascii_uppercase();
    let without_prefix = upper.strip_prefix("\\\\.\\").unwrap_or(&upper);
    if let Some(rest) = without_prefix.strip_prefix("DISPLAY") {
        !rest.is_empty() && rest.chars().all(|c| c.is_ascii_digit())
    } else {
        false
    }
}

fn normalize_monitor_name(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }

    if trimmed.eq_ignore_ascii_case(GENERIC_PNP_MONITOR) {
        return None;
    }

    Some(trimmed.to_string())
}

#[cfg(windows)]
fn utf16_buffer_to_string(buffer: &[u16]) -> String {
    let len = buffer.iter().position(|&c| c == 0).unwrap_or(buffer.len());
    if len == 0 {
        String::new()
    } else {
        String::from_utf16_lossy(&buffer[..len])
    }
}

#[cfg(windows)]
fn hardware_id_candidates(device_id: &str) -> Vec<String> {
    let mut candidates = Vec::new();
    let upper = device_id.to_ascii_uppercase();
    for prefix in ["MONITOR\\", "DISPLAY\\"] {
        if let Some(start) = upper.find(prefix) {
            let rest = &upper[start..];
            let mut parts = rest.split('\\');
            if let (Some(first), Some(second)) = (parts.next(), parts.next()) {
                candidates.push(format!("{}\\{}", first, second));
            }
        }
    }
    candidates
}

#[cfg(windows)]
fn collect_monitor_display_names() -> HashMap<String, String> {
    let mut friendly_names = HashMap::new();
    let edid_names = collect_edid_names();
    let mut adapter_index = 0;

    loop {
        let mut adapter = DISPLAY_DEVICEW::default();
        adapter.cb = std::mem::size_of::<DISPLAY_DEVICEW>() as u32;

        let adapter_found = unsafe {
            EnumDisplayDevicesW(PCWSTR::null(), adapter_index, &mut adapter, 0).as_bool()
        };
        if !adapter_found {
            break;
        }

        let adapter_name = utf16_buffer_to_string(&adapter.DeviceName);
        if adapter_name.is_empty() {
            adapter_index += 1;
            continue;
        }

        let adapter_ptr = PCWSTR(adapter.DeviceName.as_ptr());

        let mut monitor_index = 0;
        loop {
            let mut monitor = DISPLAY_DEVICEW::default();
            monitor.cb = std::mem::size_of::<DISPLAY_DEVICEW>() as u32;

            let monitor_found = unsafe {
                EnumDisplayDevicesW(adapter_ptr, monitor_index, &mut monitor, 0).as_bool()
            };

            if !monitor_found {
                break;
            }

            if monitor.StateFlags & DISPLAY_DEVICE_ACTIVE == 0 {
                monitor_index += 1;
                continue;
            }

            let monitor_identifier = utf16_buffer_to_string(&monitor.DeviceName);
            let device_string = utf16_buffer_to_string(&monitor.DeviceString);
            let device_id = utf16_buffer_to_string(&monitor.DeviceID);
            let candidate_ids = hardware_id_candidates(&device_id);

            let edid_label = candidate_ids
                .iter()
                .find_map(|key| edid_names.get(key))
                .cloned();

            let friendly_name = normalize_monitor_name(&device_string);
            let is_mirror = (monitor.StateFlags & DISPLAY_DEVICE_MIRRORING_DRIVER) != 0;

            let resolved_name = if is_mirror {
                friendly_name
                    .filter(|name| !name.is_empty())
                    .or_else(|| Some("Mirror Display".to_string()))
            } else if let Some(edid) = edid_label {
                Some(edid)
            } else {
                friendly_name
            };

            if let (Some(identifier), Some(name)) = (
                extract_display_identifier(&monitor_identifier),
                resolved_name,
            ) {
                friendly_names.entry(identifier).or_insert(name);
            }

            monitor_index += 1;
        }

        adapter_index += 1;
    }

    friendly_names
}

#[cfg(not(windows))]
fn collect_monitor_display_names() -> HashMap<String, String> {
    HashMap::new()
}

fn resolve_monitor_display_name(
    raw_identifier: Option<&str>,
    index: usize,
    display_names: &HashMap<String, String>,
) -> String {
    let fallback = format!("Monitor {}", index + 1);

    if let Some(raw) = raw_identifier {
        let trimmed = raw.trim();
        if let Some(identifier) = extract_display_identifier(trimmed) {
            if let Some(mapped) = display_names.get(&identifier) {
                return mapped.clone();
            }
        }

        if !is_raw_display_identifier(trimmed)
            && !trimmed.is_empty()
            && !trimmed.eq_ignore_ascii_case(GENERIC_PNP_MONITOR)
        {
            return trimmed.to_string();
        }
    }

    let key_from_index = format!("DISPLAY{}", index + 1);
    if let Some(mapped) = display_names.get(&key_from_index) {
        return mapped.clone();
    }

    fallback
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

#[tauri::command]
async fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let settings_path = get_settings_path(app)?;

    if let Some(parent) = settings_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create settings directory: {}", e))?;
    }

    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, json).map_err(|e| format!("Failed to write settings: {}", e))?;

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

    let settings: AppSettings =
        serde_json::from_str(&json).map_err(|e| format!("Failed to parse settings: {}", e))?;

    Ok(settings)
}

#[tauri::command]
async fn save_dashboard(
    app: tauri::AppHandle,
    layout_service: tauri::State<'_, LayoutService>,
    dashboard: LayoutState,
) -> Result<LayoutState, String> {
    layout_service.import(&app, dashboard)
}

#[tauri::command]
async fn load_dashboard(
    app: tauri::AppHandle,
    layout_service: tauri::State<'_, LayoutService>,
) -> Result<LayoutState, String> {
    layout_service.load(&app)
}

#[tauri::command]
async fn apply_layout_operation(
    app: tauri::AppHandle,
    layout_service: tauri::State<'_, LayoutService>,
    operation: LayoutOperation,
) -> Result<LayoutState, String> {
    layout_service.apply_operation(&app, operation)
}

#[tauri::command]
async fn get_layout(
    layout_service: tauri::State<'_, LayoutService>,
) -> Result<LayoutState, String> {
    Ok(layout_service.snapshot())
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

    info!(
        "[window] apply_fullscreen: requested={}, actual={}",
        fullscreen, actual_state
    );

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

    let primary_identifier = monitors.and_then(|m| m.name().map(|s| s.to_string()));
    let display_names = collect_monitor_display_names();

    let mut result = Vec::new();

    for (index, monitor) in available_monitors.iter().enumerate() {
        let raw_identifier = monitor.name().map(|s| s.to_string());
        let name = resolve_monitor_display_name(raw_identifier.as_deref(), index, &display_names);
        let size = monitor.size();
        let position = monitor.position();
        let is_primary = match (&raw_identifier, &primary_identifier) {
            (Some(current), Some(primary)) => current == primary,
            (None, None) => index == 0,
            _ => false,
        };

        result.push(Monitor {
            identifier: raw_identifier,
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
            identifier: None,
            name: "Primary Monitor".to_string(),
            size: MonitorSize {
                width: 1920,
                height: 1080,
            },
            position: MonitorPosition { x: 0, y: 0 },
            is_primary: true,
        });
    }

    Ok(result)
}

#[tauri::command]
async fn move_to_monitor(
    window: Window,
    app: tauri::AppHandle,
    monitor_index: usize,
) -> Result<(), String> {
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

#[tauri::command]
async fn open_system_clock() -> Result<(), String> {
    #[cfg(windows)]
    {
        Command::new("cmd")
            .args(["/C", "start", "ms-clock:"])
            .spawn()
            .map_err(|e| format!("Failed to open system clock: {}", e))?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.datetime")
            .spawn()
            .map_err(|e| format!("Failed to open system clock: {}", e))?;
        return Ok(());
    }

    #[cfg(target_os = "linux")]
    {
        return Err("Opening the system clock is not supported on this platform".to_string());
    }

    #[allow(unreachable_code)]
    Err("Unsupported platform".to_string())
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
            if let Ok(wmi_con) =
                WMIConnection::with_namespace_path("root\\OpenHardwareMonitor", com_con.clone())
            {
                if let Ok(results) = wmi_con
                    .raw_query::<std::collections::HashMap<String, Variant>>(
                        "SELECT * FROM Sensor WHERE SensorType='Temperature'",
                    )
                {
                    for result in results {
                        if let (Some(Variant::String(name)), Some(Variant::R4(value))) =
                            (result.get("Name"), result.get("Value"))
                        {
                            let temp = *value;
                            let sensor_name = format!("{}: {:.1}°C", name, temp);
                            available_sensors.push(sensor_name.clone());

                            info!("[sensors] OHM: {}", sensor_name);

                            // Look for CPU Tctl/Tdie specifically
                            if name.to_lowercase().contains("tctl")
                                || name.to_lowercase().contains("tdie")
                            {
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
                    if let Ok(results) = wmi_con
                        .raw_query::<std::collections::HashMap<String, Variant>>(
                            "SELECT * FROM MSAcpi_ThermalZoneTemperature",
                        )
                    {
                        for result in results {
                            if let Some(Variant::UI4(temp_kelvin)) =
                                result.get("CurrentTemperature")
                            {
                                let temp_celsius = (*temp_kelvin as f32 / 10.0) - 273.15;
                                if temp_celsius > 0.0 && temp_celsius < 150.0 {
                                    available_sensors
                                        .push(format!("Thermal Zone: {:.1}°C", temp_celsius));
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

    info!(
        "[sensors] CPU={:.1}°C, GPU={:.1}°C",
        cpu_temp.unwrap_or(0.0),
        gpu_temp.unwrap_or(0.0)
    );

    Ok(SystemTemps {
        cpu_temp,
        gpu_temp,
        cpu_usage,
        available_sensors,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(LayoutService::new(GRID_COLUMNS, GRID_ROWS))
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
            load_dashboard,
            save_dashboard,
            toggle_fullscreen,
            apply_fullscreen,
            get_monitors,
            move_to_monitor,
            open_system_clock,
            get_system_temps,
            get_layout,
            apply_layout_operation
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
