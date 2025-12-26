/**
 * System Tray Menu (SOLID: Single Responsibility)
 *
 * Creates and manages the Windows system tray icon and menu.
 * Provides quick access to common actions and widget spawning.
 *
 * Design Principles:
 * - Concise Menu: Only essential actions, no clutter
 * - Clear Labels: Descriptive text, no cryptic abbreviations
 * - Logical Grouping: Related items grouped with separators
 * - Safe Actions: No destructive actions without confirmation
 * - User Feedback: Tray icon reflects application state
 *
 * Menu Structure:
 * - Show Dashboard
 * - ---
 * - Add Widget to Desktop >
 *   - Clock
 *   - Temperature
 *   - RAM Usage
 *   - Disk Usage
 *   - Network Monitor
 * - ---
 * - Quit
 */
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Runtime,
};

/**
 * Create system tray icon and menu
 *
 * Called once during application startup.
 * Tray icon persists until application quits.
 *
 * @param app - Tauri application handle
 * @returns Result indicating success or error
 */
#[allow(dead_code)]
pub fn create_system_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    println!("[SystemTray] Creating system tray...");

    // Build menu
    let menu = build_tray_menu(app)?;

    // Get application icon
    let icon = app.default_window_icon().ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "No default window icon available for tray",
        )
    })?;

    // Create tray icon
    let _tray = TrayIconBuilder::new()
        .icon(icon.clone())
        .menu(&menu)
        .tooltip("ThirdScreen Dashboard")
        .on_menu_event(handle_menu_event)
        .on_tray_icon_event(handle_tray_event)
        .build(app)?;

    println!("[SystemTray] ✓ System tray created successfully");
    Ok(())
}

/**
 * Build tray menu structure
 *
 * Creates hierarchical menu with:
 * - Main actions (Show Dashboard)
 * - Widget submenu
 * - Quit action
 */
#[allow(dead_code)]
fn build_tray_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    // Main actions
    let show_dashboard =
        MenuItem::with_id(app, "show_dashboard", "Show Dashboard", true, None::<&str>)?;

    // Widget submenu
    let widgets_menu = build_widgets_submenu(app)?;

    // System actions
    let quit = PredefinedMenuItem::quit(app, Some("Quit"))?;

    // Separators
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;

    // Assemble menu
    Menu::with_items(app, &[&show_dashboard, &sep1, &widgets_menu, &sep2, &quit])
}

/**
 * Build widgets submenu
 *
 * Creates submenu with all available desktop widgets.
 * Widgets are organized by category (system monitoring).
 */
#[allow(dead_code)]
fn build_widgets_submenu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let clock = MenuItem::with_id(app, "add_clock", "Clock", true, None::<&str>)?;
    let temperature = MenuItem::with_id(app, "add_temperature", "Temperature", true, None::<&str>)?;
    let ram = MenuItem::with_id(app, "add_ram", "RAM Usage", true, None::<&str>)?;
    let disk = MenuItem::with_id(app, "add_disk", "Disk Usage", true, None::<&str>)?;
    let network = MenuItem::with_id(app, "add_network", "Network Monitor", true, None::<&str>)?;

    Submenu::with_items(
        app,
        "Add Widget to Desktop",
        true,
        &[&clock, &temperature, &ram, &disk, &network],
    )
}

/**
 * Handle menu item clicks
 *
 * Dispatches menu actions to appropriate handlers.
 * Uses WindowManager for window operations.
 */
#[allow(dead_code)]
fn handle_menu_event<R: Runtime>(app: &AppHandle<R>, event: tauri::menu::MenuEvent) {
    match event.id.as_ref() {
        "show_dashboard" => show_dashboard_window(app),
        "add_clock" => spawn_desktop_widget(app, "clock"),
        "add_temperature" => spawn_desktop_widget(app, "temperature"),
        "add_ram" => spawn_desktop_widget(app, "ram"),
        "add_disk" => spawn_desktop_widget(app, "disk"),
        "add_network" => spawn_desktop_widget(app, "network-monitor"),
        id => {
            eprintln!("[SystemTray] Unknown menu action: {}", id);
        }
    }
}

/**
 * Handle tray icon events
 *
 * Left-click: Show dashboard
 * Right-click: Show menu (handled by Tauri)
 */
#[allow(dead_code)]
fn handle_tray_event<R: Runtime>(tray: &tauri::tray::TrayIcon<R>, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        show_dashboard_window(tray.app_handle());
    }
}

/**
 * Show dashboard window
 *
 * Brings dashboard window to front.
 * Creates window if it doesn't exist.
 */
#[allow(dead_code)]
fn show_dashboard_window<R: Runtime>(app: &AppHandle<R>) {
    use crate::system::{WindowType, WINDOW_MANAGER};

    let window_type = WindowType::Dashboard;

    if WINDOW_MANAGER.window_exists(app, &window_type) {
        if let Err(e) = WINDOW_MANAGER.show(app, &window_type) {
            eprintln!("[SystemTray] Failed to show dashboard: {}", e);
            return;
        }
        if let Err(e) = WINDOW_MANAGER.focus(app, &window_type) {
            eprintln!("[SystemTray] Failed to focus dashboard: {}", e);
        }
    } else {
        eprintln!("[SystemTray] Dashboard window does not exist");
    }
}

/**
 * Spawn desktop widget from tray menu
 *
 * Creates a new desktop widget window.
 * Widget appears at default position on primary monitor.
 */
#[allow(dead_code)]
fn spawn_desktop_widget<R: Runtime>(app: &AppHandle<R>, widget_type: &str) {
    use crate::commands::desktop_widgets::spawn_desktop_widget as spawn_cmd;
    use crate::ipc_types::WidgetWindowConfig;
    use uuid::Uuid;

    println!("[SystemTray] Spawning widget: {}", widget_type);

    // Generate unique widget ID
    let widget_id = Uuid::new_v4().to_string();

    // Default widget configuration
    let config = WidgetWindowConfig {
        widget_id: widget_id.clone(),
        widget_type: widget_type.to_string(),
        x: 100,
        y: 100,
        width: get_default_width(widget_type),
        height: get_default_height(widget_type),
        monitor_index: None, // Use primary monitor
    };

    // Spawn widget asynchronously
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        match spawn_cmd(app_handle, config).await {
            Ok(_) => println!("[SystemTray] ✓ Widget spawned successfully"),
            Err(e) => eprintln!("[SystemTray] ✗ Failed to spawn widget: {}", e),
        }
    });
}

/**
 * Get default widget width
 *
 * Returns appropriate default width for each widget type.
 */
#[allow(dead_code)]
fn get_default_width(widget_type: &str) -> u32 {
    match widget_type {
        "clock" => 300,
        "temperature" => 250,
        "ram" => 280,
        "disk" => 280,
        "network-monitor" => 320,
        _ => 250,
    }
}

/**
 * Get default widget height
 *
 * Returns appropriate default height for each widget type.
 */
#[allow(dead_code)]
fn get_default_height(widget_type: &str) -> u32 {
    match widget_type {
        "clock" => 150,
        "temperature" => 180,
        "ram" => 160,
        "disk" => 160,
        "network-monitor" => 200,
        _ => 150,
    }
}
