use log::info;
use std::process::Command;
use tauri::Window;
use crate::system::window_placement::{WindowPlacer, WindowPlacement};

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
    // Validate input
    crate::validation::validate_monitor_index(monitor_index)
        .map_err(|e| e.to_string())?;

    info!(
        "[window] move_to_monitor -> index={}",
        monitor_index
    );

    // Get monitors for safe placement
    let monitors = app
        .available_monitors()
        .map_err(|e| format!("Failed to get monitors: {}", e))?
        .into_iter()
        .enumerate()
        .map(|(idx, m)| {
            let size = m.size();
            let position = m.position();
            let scale_factor = m.scale_factor();
            crate::ipc_types::Monitor {
                identifier: m.name().map(|s| s.to_string()),
                name: m.name().map(|s| s.to_string()).unwrap_or_else(|| format!("Monitor {}", idx + 1)),
                size: crate::ipc_types::MonitorSize {
                    width: size.width,
                    height: size.height,
                },
                position: crate::ipc_types::MonitorPosition {
                    x: position.x,
                    y: position.y,
                },
                is_primary: idx == 0,
                scale_factor,
                refresh_rate: None,
            }
        })
        .collect();

    let placer = WindowPlacer::new(monitors);
    
    // Use safe placement with relative position preservation
    let result = placer
        .move_to_monitor(&window, monitor_index, true)
        .await
        .map_err(|e| e.to_string())?;

    if result.fallback_used {
        info!("[window] move_to_monitor -> fallback used: {:?}", result.reason);
    }

    std::thread::sleep(std::time::Duration::from_millis(30));

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
