use crate::ipc_types::{Monitor, MonitorPosition, MonitorSize};
use std::collections::HashMap;

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
    use winreg::{
        enums::{HKEY_LOCAL_MACHINE, KEY_READ},
        RegKey,
    };

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
    use windows::core::PCWSTR;
    use windows::Win32::Graphics::Gdi::{
        EnumDisplayDevicesW, DISPLAY_DEVICEW, DISPLAY_DEVICE_ACTIVE, DISPLAY_DEVICE_MIRRORING_DRIVER,
    };

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

#[tauri::command]
pub async fn get_monitors(app: tauri::AppHandle) -> Result<Vec<Monitor>, String> {
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
        let scale_factor = monitor.scale_factor();
        
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
            scale_factor,
            refresh_rate: None, // Tauri doesn't expose this yet
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
            is_primary: true,            scale_factor: 1.0,
            refresh_rate: None,        });
    }

    Ok(result)
}
