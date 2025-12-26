use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use sysinfo::{Networks, System};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkStats {
    pub interface_name: String,
    pub download_speed: u64,
    pub upload_speed: u64,
    pub total_downloaded: u64,
    pub total_uploaded: u64,
    pub is_connected: bool,
}

struct NetworkSample {
    timestamp: Instant,
    total_received: u64,
    total_transmitted: u64,
}

lazy_static::lazy_static! {
    static ref LAST_SAMPLE: Arc<Mutex<Option<NetworkSample>>> = Arc::new(Mutex::new(None));
}

#[tauri::command]
pub fn get_network_stats() -> Result<NetworkStats, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let networks = Networks::new_with_refreshed_list();

    // Find the most active network interface
    let mut most_active_interface = String::from("None");
    let mut max_total_bytes = 0u64;
    let mut total_received = 0u64;
    let mut total_transmitted = 0u64;
    let mut is_connected = false;

    for (interface_name, network) in networks.iter() {
        let received = network.total_received();
        let transmitted = network.total_transmitted();
        let total = received + transmitted;

        // Skip loopback interfaces
        if interface_name.contains("Loopback")
            || interface_name.contains("lo")
            || interface_name == "lo0"
        {
            continue;
        }

        if total > max_total_bytes {
            max_total_bytes = total;
            most_active_interface = interface_name.clone();
            total_received = received;
            total_transmitted = transmitted;
            is_connected = total > 0;
        }
    }

    // Calculate speeds based on previous sample
    let mut download_speed = 0u64;
    let mut upload_speed = 0u64;

    let current_sample = NetworkSample {
        timestamp: Instant::now(),
        total_received,
        total_transmitted,
    };

    let mut last_sample_lock = LAST_SAMPLE
        .lock()
        .map_err(|e| format!("Failed to acquire network sample lock: {}", e))?;

    if let Some(ref last_sample) = *last_sample_lock {
        let elapsed = current_sample
            .timestamp
            .duration_since(last_sample.timestamp);
        let elapsed_secs = elapsed.as_secs_f64();

        if elapsed_secs > 0.0 {
            let received_diff = current_sample
                .total_received
                .saturating_sub(last_sample.total_received);
            let transmitted_diff = current_sample
                .total_transmitted
                .saturating_sub(last_sample.total_transmitted);

            download_speed = (received_diff as f64 / elapsed_secs) as u64;
            upload_speed = (transmitted_diff as f64 / elapsed_secs) as u64;
        }
    }

    *last_sample_lock = Some(current_sample);
    drop(last_sample_lock);

    Ok(NetworkStats {
        interface_name: most_active_interface,
        download_speed,
        upload_speed,
        total_downloaded: total_received,
        total_uploaded: total_transmitted,
        is_connected,
    })
}
