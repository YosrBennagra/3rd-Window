use sysinfo::System;

#[tauri::command]
pub fn get_system_uptime() -> Result<u64, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    Ok(System::uptime())
}
