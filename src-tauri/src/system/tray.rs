use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Runtime,
};

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    // Create menu items
    let show_dashboard =
        MenuItem::with_id(app, "show_dashboard", "Show Dashboard", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "open_settings", "Settings", true, None::<&str>)?;
    let separator1 = PredefinedMenuItem::separator(app)?;

    // Widget submenu
    let clock_widget = MenuItem::with_id(app, "add_clock", "Clock", true, None::<&str>)?;
    let temp_widget = MenuItem::with_id(app, "add_temperature", "Temperature", true, None::<&str>)?;
    let ram_widget = MenuItem::with_id(app, "add_ram", "RAM Usage", true, None::<&str>)?;
    let disk_widget = MenuItem::with_id(app, "add_disk", "Disk Usage", true, None::<&str>)?;
    let network_widget =
        MenuItem::with_id(app, "add_network", "Network Monitor", true, None::<&str>)?;

    let widgets_menu = Submenu::with_items(
        app,
        "Add Widget to Desktop",
        true,
        &[&clock_widget, &temp_widget, &ram_widget, &disk_widget, &network_widget],
    )?;

    let separator2 = PredefinedMenuItem::separator(app)?;
    let quit = PredefinedMenuItem::quit(app, Some("Quit"))?;

    // Build menu
    let menu = Menu::with_items(
        app,
        &[&show_dashboard, &settings_item, &separator1, &widgets_menu, &separator2, &quit],
    )?;

    // Create tray icon
    let icon = app.default_window_icon().ok_or_else(|| {
        std::io::Error::new(std::io::ErrorKind::NotFound, "No default window icon available")
    })?;

    let _tray = TrayIconBuilder::new()
        .icon(icon.clone())
        .menu(&menu)
        .tooltip("ThirdScreen Dashboard")
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "show_dashboard" => {
                use crate::system::{WindowType, WINDOW_MANAGER};
                let window_type = WindowType::Dashboard;
                if WINDOW_MANAGER.window_exists(app, &window_type) {
                    let _ = WINDOW_MANAGER.show(app, &window_type);
                    let _ = WINDOW_MANAGER.focus(app, &window_type);
                }
            },
            "open_settings" => {
                use crate::system::{WindowConfig, WINDOW_MANAGER};
                let config = WindowConfig::settings();
                let _ = WINDOW_MANAGER.create_window(app, config);
            },
            "add_clock" => spawn_widget_from_tray(app, "clock"),
            "add_temperature" => spawn_widget_from_tray(app, "temperature"),
            "add_ram" => spawn_widget_from_tray(app, "ram"),
            "add_disk" => spawn_widget_from_tray(app, "disk"),
            "add_network" => spawn_widget_from_tray(app, "network-monitor"),
            _ => {},
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                use crate::system::{WindowType, WINDOW_MANAGER};
                let app = tray.app_handle();
                let window_type = WindowType::Dashboard;
                if WINDOW_MANAGER.window_exists(app, &window_type) {
                    let _ = WINDOW_MANAGER.show(app, &window_type);
                    let _ = WINDOW_MANAGER.focus(app, &window_type);
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn spawn_widget_from_tray<R: Runtime>(app: &AppHandle<R>, widget_type: &str) {
    use crate::commands::desktop_widgets::spawn_desktop_widget;
    use crate::ipc_types::WidgetWindowConfig;
    use uuid::Uuid;

    // Generate unique ID
    let widget_id = Uuid::new_v4().to_string();

    // Default position and size
    let config = WidgetWindowConfig {
        widget_id: widget_id.clone(),
        widget_type: widget_type.to_string(),
        x: 100,
        y: 100,
        width: match widget_type {
            "clock" => 300,
            "temperature" => 250,
            "ram" => 280,
            "disk" => 280,
            "network-monitor" => 320,
            _ => 250,
        },
        height: match widget_type {
            "clock" => 150,
            "temperature" => 180,
            "ram" => 160,
            "disk" => 160,
            "network-monitor" => 200,
            _ => 150,
        },
        monitor_index: None,
    };

    // Spawn widget asynchronously
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = spawn_desktop_widget(app_handle, config).await {
            eprintln!("Failed to spawn widget from tray: {}", e);
        }
    });
}
