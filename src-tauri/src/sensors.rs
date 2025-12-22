use rand;
use serde::Serialize;
use sysinfo::System;

#[derive(Debug, Serialize)]
pub struct SystemTemps {
    pub cpu_temp: Option<f32>,
    pub gpu_temp: Option<f32>,
    pub cpu_usage: f32,
    pub available_sensors: Vec<String>,
}

#[cfg(windows)]
fn get_wmi_temps() -> (Option<f32>, Vec<String>) {
    use log::info;
    use wmi::{COMLibrary, Variant, WMIConnection};

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
                            if let Some(Variant::UI4(temp_kelvin)) = result.get("CurrentTemperature")
                            {
                                let temp_celsius = (*temp_kelvin as f32 / 10.0) - 273.15;
                                if temp_celsius > 0.0 && temp_celsius < 150.0 {
                                    available_sensors
                                        .push(format!("Thermal Zone: {:.1}°C", temp_celsius));
                                    if cpu_temp.is_none() {
                                        cpu_temp = Some(temp_celsius);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        Err(e) => log::info!("[sensors] COM library error: {}", e),
    }

    (cpu_temp, available_sensors)
}

#[cfg(not(windows))]
fn get_wmi_temps() -> (Option<f32>, Vec<String>) {
    (None, Vec::new())
}

#[tauri::command]
pub async fn get_system_temps() -> Result<SystemTemps, String> {
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

    log::info!(
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
