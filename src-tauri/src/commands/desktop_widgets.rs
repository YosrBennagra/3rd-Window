use crate::ipc_types::WidgetWindowConfig;
use crate::system::{WindowConfig, WindowType, WINDOW_MANAGER};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, Runtime};

// Track active widget windows
static WIDGET_WINDOWS: Mutex<Option<HashMap<String, WidgetWindowConfig>>> = Mutex::new(None);

fn get_widget_windows() -> Result<HashMap<String, WidgetWindowConfig>, String> {
    let mut guard = WIDGET_WINDOWS
        .lock()
        .map_err(|e| format!("Failed to acquire widget lock: {}", e))?;
    if guard.is_none() {
        *guard = Some(HashMap::new());
    }
    Ok(guard.as_ref().ok_or("Widget map unexpectedly None")?.clone())
}

fn add_widget_window(widget_id: String, config: WidgetWindowConfig) -> Result<(), String> {
    let mut guard = WIDGET_WINDOWS
        .lock()
        .map_err(|e| format!("Failed to acquire widget lock: {}", e))?;
    if guard.is_none() {
        *guard = Some(HashMap::new());
    }
    guard.as_mut().ok_or("Widget map unexpectedly None")?.insert(widget_id, config);
    Ok(())
}

fn remove_widget_window(widget_id: &str) -> Result<(), String> {
    let mut guard = WIDGET_WINDOWS
        .lock()
        .map_err(|e| format!("Failed to acquire widget lock: {}", e))?;
    if let Some(map) = guard.as_mut() {
        map.remove(widget_id);
    }
    Ok(())
}

fn get_widgets_path<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
        .map(|mut path| {
            path.push("desktop_widgets.json");
            path
        })
}

fn save_widgets_to_disk<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let widgets_path = get_widgets_path(app)?;
    let widgets = get_widget_windows()?;

    if let Some(parent) = widgets_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create widgets directory: {}", e))?;
    }

    let configs: Vec<WidgetWindowConfig> = widgets.values().cloned().collect();
    let json = serde_json::to_string_pretty(&configs)
        .map_err(|e| format!("Failed to serialize widgets: {}", e))?;

    fs::write(&widgets_path, json).map_err(|e| format!("Failed to write widgets: {}", e))?;

    Ok(())
}

fn load_widgets_from_disk<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<Vec<WidgetWindowConfig>, String> {
    let widgets_path = get_widgets_path(app)?;

    if !widgets_path.exists() {
        return Ok(Vec::new());
    }

    let json = fs::read_to_string(&widgets_path)
        .map_err(|e| format!("Failed to read widgets file: {}", e))?;

    let configs: Vec<WidgetWindowConfig> =
        serde_json::from_str(&json).map_err(|e| format!("Failed to parse widgets: {}", e))?;

    Ok(configs)
}

#[tauri::command]
pub async fn spawn_desktop_widget<R: Runtime>(
    app: AppHandle<R>,
    config: WidgetWindowConfig,
) -> Result<String, String> {
    // Validate input
    crate::validation::validate_widget_config(&config).map_err(|e| e.to_string())?;

    let widget_id = config.widget_id.clone();
    let window_type = WindowType::Widget(widget_id.clone());

    // Check if widget window already exists
    if WINDOW_MANAGER.window_exists(&app, &window_type) {
        return Err(format!("Widget window {} already exists", widget_id));
    }

    // Create window config
    let window_config = WindowConfig::widget(
        widget_id.clone(),
        config.widget_type.clone(),
        config.width,
        config.height,
        config.x,
        config.y,
    );

    // Create window via centralized manager
    let window = WINDOW_MANAGER.create_window(&app, window_config)?;

    // Show window after a brief delay to prevent flicker
    let window_clone = window.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        let _ = window_clone.show();
    });

    // Track the widget window
    add_widget_window(widget_id.clone(), config.clone())?;

    // Persist to disk
    save_widgets_to_disk(&app)?;

    Ok(widget_id)
}

#[tauri::command]
pub async fn close_desktop_widget<R: Runtime>(
    app: AppHandle<R>,
    widget_id: String,
) -> Result<(), String> {
    // Validate input
    crate::validation::validate_widget_id(&widget_id).map_err(|e| e.to_string())?;

    let window_type = WindowType::Widget(widget_id.clone());

    // Close window via centralized manager
    WINDOW_MANAGER.close_window(&app, &window_type)?;

    // Remove from tracking
    remove_widget_window(&widget_id)?;

    // Persist to disk (log error but don't fail the close operation)
    if let Err(e) = save_widgets_to_disk(&app) {
        eprintln!("Warning: Failed to save widgets after close: {}", e);
    }

    Ok(())
}

#[tauri::command]
pub async fn update_widget_position<R: Runtime>(
    app: AppHandle<R>,
    widget_id: String,
    x: i32,
    y: i32,
) -> Result<(), String> {
    // Validate inputs
    crate::validation::validate_widget_id(&widget_id).map_err(|e| e.to_string())?;
    crate::validation::validate_coordinates(x, y).map_err(|e| e.to_string())?;

    let window_type = WindowType::Widget(widget_id.clone());

    // Update position via centralized manager
    WINDOW_MANAGER.set_position(&app, &window_type, x, y)?;

    // Update tracked config
    let mut windows = get_widget_windows()?;
    if let Some(config) = windows.get_mut(&widget_id) {
        config.x = x;
        config.y = y;
        let mut guard = WIDGET_WINDOWS
            .lock()
            .map_err(|e| format!("Failed to acquire widget lock: {}", e))?;
        *guard = Some(windows);

        // Persist to disk
        save_widgets_to_disk(&app)?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_desktop_widgets<R: Runtime>(
    app: AppHandle<R>,
) -> Result<Vec<WidgetWindowConfig>, String> {
    // Load from disk instead of memory to ensure persistence across restarts
    load_widgets_from_disk(&app)
}

#[tauri::command]
pub async fn update_widget_size<R: Runtime>(
    app: AppHandle<R>,
    widget_id: String,
    width: u32,
    height: u32,
) -> Result<(), String> {
    // Validate inputs
    crate::validation::validate_widget_id(&widget_id).map_err(|e| e.to_string())?;
    crate::validation::validate_dimensions(width, height).map_err(|e| e.to_string())?;

    let window_type = WindowType::Widget(widget_id.clone());

    // Update size via centralized manager
    WINDOW_MANAGER.set_size(&app, &window_type, width, height)?;

    // Update tracked config
    let mut windows = get_widget_windows()?;
    if let Some(config) = windows.get_mut(&widget_id) {
        config.width = width;
        config.height = height;
        let mut guard = WIDGET_WINDOWS
            .lock()
            .map_err(|e| format!("Failed to acquire widget lock: {}", e))?;
        *guard = Some(windows);

        // Persist to disk
        save_widgets_to_disk(&app)?;
    }

    Ok(())
}
