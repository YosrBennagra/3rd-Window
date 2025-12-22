use tauri::{AppHandle, Manager, Runtime, WebviewUrl, WebviewWindowBuilder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WidgetWindowConfig {
    pub widget_id: String,
    pub widget_type: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub monitor_index: Option<usize>,
}

// Track active widget windows
static WIDGET_WINDOWS: Mutex<Option<HashMap<String, WidgetWindowConfig>>> = Mutex::new(None);

fn get_widget_windows() -> HashMap<String, WidgetWindowConfig> {
    let mut guard = WIDGET_WINDOWS.lock().unwrap();
    if guard.is_none() {
        *guard = Some(HashMap::new());
    }
    guard.as_ref().unwrap().clone()
}

fn add_widget_window(widget_id: String, config: WidgetWindowConfig) {
    let mut guard = WIDGET_WINDOWS.lock().unwrap();
    if guard.is_none() {
        *guard = Some(HashMap::new());
    }
    guard.as_mut().unwrap().insert(widget_id, config);
}

fn remove_widget_window(widget_id: &str) {
    let mut guard = WIDGET_WINDOWS.lock().unwrap();
    if let Some(map) = guard.as_mut() {
        map.remove(widget_id);
    }
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
    let widgets = get_widget_windows();
    
    if let Some(parent) = widgets_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create widgets directory: {}", e))?;
    }

    let configs: Vec<WidgetWindowConfig> = widgets.values().cloned().collect();
    let json = serde_json::to_string_pretty(&configs)
        .map_err(|e| format!("Failed to serialize widgets: {}", e))?;

    fs::write(&widgets_path, json)
        .map_err(|e| format!("Failed to write widgets: {}", e))?;

    Ok(())
}

fn load_widgets_from_disk<R: Runtime>(app: &AppHandle<R>) -> Result<Vec<WidgetWindowConfig>, String> {
    let widgets_path = get_widgets_path(app)?;
    
    if !widgets_path.exists() {
        return Ok(Vec::new());
    }

    let json = fs::read_to_string(&widgets_path)
        .map_err(|e| format!("Failed to read widgets file: {}", e))?;

    let configs: Vec<WidgetWindowConfig> = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse widgets: {}", e))?;

    Ok(configs)
}

#[tauri::command]
pub async fn spawn_desktop_widget<R: Runtime>(
    app: AppHandle<R>,
    config: WidgetWindowConfig,
) -> Result<String, String> {
    let widget_id = config.widget_id.clone();
    let label = format!("widget-{}", widget_id);

    // Check if widget window already exists
    if app.get_webview_window(&label).is_some() {
        return Err(format!("Widget window {} already exists", widget_id));
    }

    // Build the URL with widget type parameter
    // Use the same base URL as the main window (development or production)
    let base_url = if cfg!(dev) {
        "http://localhost:5173"
    } else {
        "tauri://localhost"
    };
    
    let url = format!(
        "{}/#/desktop-widget?id={}&type={}",
        base_url, widget_id, config.widget_type
    );

    // Create frameless, transparent, always-on-top window
    let window = WebviewWindowBuilder::new(&app, &label, WebviewUrl::External(url.parse().unwrap()))
        .title(&format!("Widget: {}", config.widget_type))
        .inner_size(config.width as f64, config.height as f64)
        .position(config.x as f64, config.y as f64)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .visible(false) // Start hidden, show after content loads
        .build()
        .map_err(|e| format!("Failed to create widget window: {}", e))?;

    // Show window after a brief delay to prevent flicker
    let window_clone = window.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        let _ = window_clone.show();
    });

    // Track the widget window
    add_widget_window(widget_id.clone(), config.clone());
    
    // Persist to disk
    let _ = save_widgets_to_disk(&app);

    Ok(widget_id)
}

#[tauri::command]
pub async fn close_desktop_widget<R: Runtime>(
    app: AppHandle<R>,
    widget_id: String,
) -> Result<(), String> {
    let label = format!("widget-{}", widget_id);

    if let Some(window) = app.get_webview_window(&label) {
        window
            .close()
            .map_err(|e| format!("Failed to close widget window: {}", e))?;
        remove_widget_window(&widget_id);
        
        // Persist to disk
        let _ = save_widgets_to_disk(&app);
        
        Ok(())
    } else {
        Err(format!("Widget window {} not found", widget_id))
    }
}

#[tauri::command]
pub async fn update_widget_position<R: Runtime>(
    app: AppHandle<R>,
    widget_id: String,
    x: i32,
    y: i32,
) -> Result<(), String> {
    let label = format!("widget-{}", widget_id);

    if let Some(window) = app.get_webview_window(&label) {
        use tauri::Position;
        window
            .set_position(Position::Physical(tauri::PhysicalPosition { x, y }))
            .map_err(|e| format!("Failed to update widget position: {}", e))?;

        // Update tracked config
        let mut windows = get_widget_windows();
        if let Some(config) = windows.get_mut(&widget_id) {
            config.x = x;
            config.y = y;
            let mut guard = WIDGET_WINDOWS.lock().unwrap();
            *guard = Some(windows);
            
            // Persist to disk
            let _ = save_widgets_to_disk(&app);
        }

        Ok(())
    } else {
        Err(format!("Widget window {} not found", widget_id))
    }
}

#[tauri::command]
pub fn get_desktop_widgets<R: Runtime>(app: AppHandle<R>) -> Result<Vec<WidgetWindowConfig>, String> {
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
    let label = format!("widget-{}", widget_id);

    if let Some(window) = app.get_webview_window(&label) {
        use tauri::Size;
        window
            .set_size(Size::Physical(tauri::PhysicalSize { width, height }))
            .map_err(|e| format!("Failed to update widget size: {}", e))?;

        // Update tracked config
        let mut windows = get_widget_windows();
        if let Some(config) = windows.get_mut(&widget_id) {
            config.width = width;
            config.height = height;
            let mut guard = WIDGET_WINDOWS.lock().unwrap();
            *guard = Some(windows);
        }

        Ok(())
    } else {
        Err(format!("Widget window {} not found", widget_id))
    }
}
