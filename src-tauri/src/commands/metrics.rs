use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use sysinfo::{Disks, Networks, System};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemMetrics {
    pub cpu_usage: f32,
    pub cpu_temp: f32,
    pub gpu_temp: f32,
    pub ram_used_bytes: u64,
    pub ram_total_bytes: u64,
    pub disk_used_bytes: u64,
    pub disk_total_bytes: u64,
    pub net_up_mbps: f64,
    pub net_down_mbps: f64,
}

struct NetworkSample {
    timestamp: Instant,
    total_received: u64,
    total_transmitted: u64,
}

lazy_static::lazy_static! {
    static ref LAST_NET_SAMPLE: Arc<Mutex<Option<NetworkSample>>> = Arc::new(Mutex::new(None));
}

#[cfg(target_os = "windows")]
fn get_cpu_temperature() -> f32 {
    use wmi::{COMLibrary, Variant, WMIConnection};

    match COMLibrary::new() {
        Ok(com_lib) => {
            match WMIConnection::new(com_lib) {
                Ok(wmi_con) => {
                    let query = "SELECT CurrentTemperature FROM Win32_PerfFormattedData_Counters_ThermalZoneInformation";

                    match wmi_con.raw_query::<std::collections::HashMap<String, Variant>>(query) {
                        Ok(results) => {
                            for result in results {
                                if let Some(Variant::UI4(temp)) = result.get("CurrentTemperature") {
                                    // Temperature is in tenths of Kelvin, convert to Celsius
                                    return (*temp as f32 / 10.0) - 273.15;
                                }
                            }
                            0.0
                        },
                        Err(_) => 0.0,
                    }
                },
                Err(_) => 0.0,
            }
        },
        Err(_) => 0.0,
    }
}

#[cfg(not(target_os = "windows"))]
fn get_cpu_temperature() -> f32 {
    0.0 // Placeholder for non-Windows platforms
}

#[cfg(target_os = "windows")]
fn get_gpu_temperature() -> f32 {
    // GPU temp reading on Windows requires vendor-specific APIs or OpenHardwareMonitor
    // Return 0 for now as it requires additional dependencies
    0.0
}

#[cfg(not(target_os = "windows"))]
fn get_gpu_temperature() -> f32 {
    0.0
}

#[tauri::command]
pub fn get_system_metrics() -> Result<SystemMetrics, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    // CPU usage - average across all CPUs
    sys.refresh_cpu_all();
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu_all();

    let cpu_usage = sys.global_cpu_usage();

    // Memory
    let ram_used = sys.used_memory();
    let ram_total = sys.total_memory();

    // Disk - get primary disk
    let disks = Disks::new_with_refreshed_list();
    let (mut disk_used, mut disk_total) = (0u64, 0u64);

    // Find the largest disk (likely C:\ on Windows)
    for disk in disks.iter() {
        let total = disk.total_space();
        if total > disk_total {
            disk_total = total;
            disk_used = total - disk.available_space();
        }
    }

    // Network speeds
    let networks = Networks::new_with_refreshed_list();
    let mut total_received = 0u64;
    let mut total_transmitted = 0u64;

    for (interface_name, network) in networks.iter() {
        // Skip loopback
        if interface_name.contains("Loopback") || interface_name.contains("lo") {
            continue;
        }
        total_received += network.total_received();
        total_transmitted += network.total_transmitted();
    }

    let mut net_down_mbps = 0.0;
    let mut net_up_mbps = 0.0;

    let current_sample =
        NetworkSample { timestamp: Instant::now(), total_received, total_transmitted };

    let mut last_sample_lock = LAST_NET_SAMPLE
        .lock()
        .map_err(|e| format!("Failed to acquire metrics sample lock: {}", e))?;
    if let Some(ref last_sample) = *last_sample_lock {
        let elapsed = current_sample.timestamp.duration_since(last_sample.timestamp);
        let elapsed_secs = elapsed.as_secs_f64();

        if elapsed_secs > 0.0 {
            let received_diff =
                current_sample.total_received.saturating_sub(last_sample.total_received);
            let transmitted_diff =
                current_sample.total_transmitted.saturating_sub(last_sample.total_transmitted);

            net_down_mbps = (received_diff as f64 / elapsed_secs) / (1024.0 * 1024.0);
            net_up_mbps = (transmitted_diff as f64 / elapsed_secs) / (1024.0 * 1024.0);
        }
    }
    *last_sample_lock = Some(current_sample);

    // Temperatures
    let cpu_temp = get_cpu_temperature();
    let gpu_temp = get_gpu_temperature();

    Ok(SystemMetrics {
        cpu_usage,
        cpu_temp,
        gpu_temp,
        ram_used_bytes: ram_used,
        ram_total_bytes: ram_total,
        disk_used_bytes: disk_used,
        disk_total_bytes: disk_total,
        net_up_mbps,
        net_down_mbps,
    })
}
