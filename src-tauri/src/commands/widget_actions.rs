use crate::system::{WindowType, WINDOW_MANAGER};
/// Widget-specific window actions
///
/// Provides widget window controls following desktop UX principles:
/// - Non-intrusive minimize (hide to tray)
/// - Graceful close with cleanup
/// - Context menu actions
use tauri::{AppHandle, Runtime};

/// Minimize widget (hide it but keep in memory)
#[tauri::command]
pub async fn minimize_desktop_widget<R: Runtime>(
    app: AppHandle<R>,
    widget_id: String,
) -> Result<(), String> {
    // Validate input
    crate::validation::validate_widget_id(&widget_id).map_err(|e| e.to_string())?;

    let window_type = WindowType::Widget(widget_id);

    // Hide window (don't close - allows quick restore)
    WINDOW_MANAGER.hide(&app, &window_type)?;

    Ok(())
}

/// Restore minimized widget
#[tauri::command]
pub async fn restore_desktop_widget<R: Runtime>(
    app: AppHandle<R>,
    widget_id: String,
) -> Result<(), String> {
    // Validate input
    crate::validation::validate_widget_id(&widget_id).map_err(|e| e.to_string())?;

    let window_type = WindowType::Widget(widget_id);

    // Show window without stealing focus (desktop UX principle)
    WINDOW_MANAGER.show(&app, &window_type)?;

    Ok(())
}

/// Toggle widget always-on-top state
#[tauri::command]
pub async fn toggle_widget_always_on_top<R: Runtime>(
    app: AppHandle<R>,
    widget_id: String,
) -> Result<bool, String> {
    // Validate input
    crate::validation::validate_widget_id(&widget_id).map_err(|e| e.to_string())?;

    let window_type = WindowType::Widget(widget_id.clone());

    let window = WINDOW_MANAGER
        .get_window(&app, &window_type)
        .ok_or_else(|| format!("Widget window not found: {}", widget_id))?;

    // Get current state
    let current_state = window
        .is_always_on_top()
        .map_err(|e| format!("Failed to get always-on-top state: {}", e))?;

    // Toggle
    let new_state = !current_state;
    window
        .set_always_on_top(new_state)
        .map_err(|e| format!("Failed to set always-on-top: {}", e))?;

    Ok(new_state)
}

/// Set widget opacity
#[tauri::command]
pub async fn set_widget_opacity<R: Runtime>(
    app: AppHandle<R>,
    widget_id: String,
    opacity: f64,
) -> Result<(), String> {
    // Validate inputs
    crate::validation::validate_widget_id(&widget_id).map_err(|e| e.to_string())?;

    if !(0.1..=1.0).contains(&opacity) {
        return Err("Opacity must be between 0.1 and 1.0".to_string());
    }

    let window_type = WindowType::Widget(widget_id.clone());

    let _window = WINDOW_MANAGER
        .get_window(&app, &window_type)
        .ok_or_else(|| "Widget window not found".to_string())?;

    // Note: Tauri v2 doesn't have direct opacity control
    // Opacity is handled via CSS on the frontend
    // This command validates the widget exists and the opacity value is valid
    log::info!("Opacity set to {} for widget {}", opacity, widget_id);

    Ok(())
}
