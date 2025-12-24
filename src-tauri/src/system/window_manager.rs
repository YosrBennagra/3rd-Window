/// Centralized Window Manager for ThirdScreen
/// 
/// Manages window lifecycle, identity, and coordination following multi-window
/// management principles: centralized control, predictable lifecycle, clear identity.

use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, Position, Runtime, Size, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use std::collections::HashMap;
use std::sync::Mutex;

/// Window type identifiers
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum WindowType {
    /// Main dashboard window
    Dashboard,
    /// Desktop widget window
    Widget(String),  // widget_id
    /// Widget picker/selector window
    WidgetPicker,
    /// Settings window
    Settings,
}

impl WindowType {
    /// Generate stable window label for Tauri
    pub fn to_label(&self) -> String {
        match self {
            WindowType::Dashboard => "main".to_string(),
            WindowType::Widget(id) => format!("widget-{}", id),
            WindowType::WidgetPicker => "widget-picker".to_string(),
            WindowType::Settings => "settings".to_string(),
        }
    }

    /// Get window's role/purpose
    pub fn purpose(&self) -> &str {
        match self {
            WindowType::Dashboard => "Main dashboard and control panel",
            WindowType::Widget(_) => "Desktop widget display",
            WindowType::WidgetPicker => "Widget selection interface",
            WindowType::Settings => "Application settings",
        }
    }
}

/// Window configuration for creation
#[derive(Debug, Clone)]
pub struct WindowConfig {
    pub window_type: WindowType,
    pub title: String,
    pub url: String,
    pub width: u32,
    pub height: u32,
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub resizable: bool,
    pub decorations: bool,
    pub transparent: bool,
    pub always_on_top: bool,
    pub skip_taskbar: bool,
    pub center: bool,
    pub visible: bool,
}

impl WindowConfig {
    /// Create default config for dashboard window
    pub fn dashboard() -> Self {
        Self {
            window_type: WindowType::Dashboard,
            title: "ThirdScreen".to_string(),
            url: "/".to_string(),
            width: 1200,
            height: 800,
            x: None,
            y: None,
            resizable: true,
            decorations: true,
            transparent: false,
            always_on_top: false,
            skip_taskbar: false,
            center: true,
            visible: true,
        }
    }

    /// Create config for widget window
    pub fn widget(widget_id: String, widget_type: String, width: u32, height: u32, x: i32, y: i32) -> Self {
        Self {
            window_type: WindowType::Widget(widget_id.clone()),
            title: format!("Widget: {}", widget_type),
            url: format!("/#/desktop-widget?id={}&type={}", widget_id, widget_type),
            width,
            height,
            x: Some(x),
            y: Some(y),
            resizable: false,
            decorations: false,
            transparent: true,
            always_on_top: true,
            skip_taskbar: true,
            center: false,
            visible: false,  // Start hidden, show after load
        }
    }

    /// Create config for widget picker
    pub fn widget_picker() -> Self {
        Self {
            window_type: WindowType::WidgetPicker,
            title: "Add Widget".to_string(),
            url: "/#/widget-picker?mode=desktop".to_string(),
            width: 1270,
            height: 650,
            x: None,
            y: None,
            resizable: true,
            decorations: true,
            transparent: false,
            always_on_top: true,
            skip_taskbar: false,
            center: true,
            visible: true,
        }
    }
}

/// Tracks window state and metadata
#[derive(Debug, Clone)]
struct WindowState {
    window_type: WindowType,
    created_at: std::time::Instant,
    config: WindowConfig,
}

/// Centralized window manager
pub struct WindowManager {
    windows: Mutex<HashMap<String, WindowState>>,
}

impl WindowManager {
    pub fn new() -> Self {
        Self {
            windows: Mutex::new(HashMap::new()),
        }
    }

    /// Create or reuse a window
    pub fn create_window<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        config: WindowConfig,
    ) -> Result<WebviewWindow<R>, String> {
        let label = config.window_type.to_label();

        // Check if window already exists
        if let Some(existing) = app.get_webview_window(&label) {
            // Window exists - show but don't force focus (non-intrusive)
            existing.show()
                .map_err(|e| format!("Failed to show existing window: {}", e))?;
            
            // Only set focus if explicitly requested via config flag
            // Default behavior: window appears but doesn't steal focus
            if config.window_type == WindowType::Dashboard {
                // Main dashboard can take focus when explicitly opened
                existing.set_focus()
                    .map_err(|e| format!("Failed to focus existing window: {}", e))?;
            }
            // For widget windows, DON'T steal focus - let them appear passively
            
            return Ok(existing);
        }

        // Build URL
        let base_url = if cfg!(dev) {
            "http://localhost:5173"
        } else {
            "tauri://localhost"
        };
        let full_url = format!("{}{}", base_url, config.url);
        
        let parsed_url = full_url.parse()
            .map_err(|e| format!("Failed to parse window URL: {}", e))?;

        // Create new window
        let mut builder = WebviewWindowBuilder::new(app, &label, WebviewUrl::External(parsed_url))
            .title(&config.title)
            .inner_size(config.width as f64, config.height as f64)
            .resizable(config.resizable)
            .decorations(config.decorations)
            .transparent(config.transparent)
            .always_on_top(config.always_on_top)
            .skip_taskbar(config.skip_taskbar)
            .visible(config.visible);

        // Apply positioning
        if config.center {
            builder = builder.center();
        } else if let (Some(x), Some(y)) = (config.x, config.y) {
            builder = builder.position(x as f64, y as f64);
        }

        let window = builder.build()
            .map_err(|e| format!("Failed to create window: {}", e))?;

        // Track window
        let mut windows = self.windows.lock()
            .map_err(|e| format!("Failed to acquire window manager lock: {}", e))?;
        
        windows.insert(label, WindowState {
            window_type: config.window_type.clone(),
            created_at: std::time::Instant::now(),
            config,
        });

        Ok(window)
    }

    /// Close and cleanup a window
    pub fn close_window<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        window_type: &WindowType,
    ) -> Result<(), String> {
        let label = window_type.to_label();

        if let Some(window) = app.get_webview_window(&label) {
            window.close()
                .map_err(|e| format!("Failed to close window: {}", e))?;
        }

        // Remove from tracking
        let mut windows = self.windows.lock()
            .map_err(|e| format!("Failed to acquire window manager lock: {}", e))?;
        windows.remove(&label);

        Ok(())
    }

    /// Check if a window exists
    pub fn window_exists<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        window_type: &WindowType,
    ) -> bool {
        let label = window_type.to_label();
        app.get_webview_window(&label).is_some()
    }

    /// Get window reference if it exists
    pub fn get_window<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        window_type: &WindowType,
    ) -> Option<WebviewWindow<R>> {
        let label = window_type.to_label();
        app.get_webview_window(&label)
    }

    /// Update window position
    pub fn set_position<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        window_type: &WindowType,
        x: i32,
        y: i32,
    ) -> Result<(), String> {
        let window = self.get_window(app, window_type)
            .ok_or_else(|| format!("Window not found: {:?}", window_type))?;

        window.set_position(Position::Physical(PhysicalPosition { x, y }))
            .map_err(|e| format!("Failed to set window position: {}", e))?;

        Ok(())
    }

    /// Update window size
    pub fn set_size<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        window_type: &WindowType,
        width: u32,
        height: u32,
    ) -> Result<(), String> {
        let window = self.get_window(app, window_type)
            .ok_or_else(|| format!("Window not found: {:?}", window_type))?;

        window.set_size(Size::Physical(PhysicalSize { width, height }))
            .map_err(|e| format!("Failed to set window size: {}", e))?;

        Ok(())
    }

    /// Show a window
    pub fn show<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        window_type: &WindowType,
    ) -> Result<(), String> {
        let window = self.get_window(app, window_type)
            .ok_or_else(|| format!("Window not found: {:?}", window_type))?;

        window.show()
            .map_err(|e| format!("Failed to show window: {}", e))?;

        Ok(())
    }

    /// Hide a window
    pub fn hide<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        window_type: &WindowType,
    ) -> Result<(), String> {
        let window = self.get_window(app, window_type)
            .ok_or_else(|| format!("Window not found: {:?}", window_type))?;

        window.hide()
            .map_err(|e| format!("Failed to hide window: {}", e))?;

        Ok(())
    }

    /// Focus a window
    pub fn focus<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        window_type: &WindowType,
    ) -> Result<(), String> {
        let window = self.get_window(app, window_type)
            .ok_or_else(|| format!("Window not found: {:?}", window_type))?;

        window.set_focus()
            .map_err(|e| format!("Failed to focus window: {}", e))?;

        Ok(())
    }

    /// Get list of active window types
    pub fn active_windows(&self) -> Result<Vec<WindowType>, String> {
        let windows = self.windows.lock()
            .map_err(|e| format!("Failed to acquire window manager lock: {}", e))?;

        Ok(windows.values().map(|state| state.window_type.clone()).collect())
    }
}

// Global window manager instance
lazy_static::lazy_static! {
    pub static ref WINDOW_MANAGER: WindowManager = WindowManager::new();
}
