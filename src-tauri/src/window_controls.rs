use log::info;
use std::process::Command;
use tauri::Window;

#[tauri::command]
pub async fn toggle_fullscreen(window: Window) -> Result<bool, String> {
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
pub async fn apply_fullscreen(window: Window, fullscreen: bool) -> Result<(), String> {
    info!("[window] apply_fullscreen: {}", fullscreen);

    // Small delay to allow window state to settle on Windows
    std::thread::sleep(std::time::Duration::from_millis(50));

    window
        .set_fullscreen(fullscreen)
        .map_err(|e| format!("Failed to apply fullscreen: {}", e))?;

    // Verify the state was applied
    let _actual_state = window
        .is_fullscreen()
        .map_err(|e| format!("Failed to verify fullscreen: {}", e))?;

    info!(
        "[window] apply_fullscreen: requested={}, actual=_actual_state",
        fullscreen
    );

    Ok(())
}

#[tauri::command]
pub async fn move_to_monitor(
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
pub async fn open_system_clock() -> Result<(), String> {
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
