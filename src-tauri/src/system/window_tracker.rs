use crate::ipc_types::ActiveWindowInfo;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

// Simple in-memory tracking of active window
#[derive(Debug)]
struct WindowTracker {
    current_window: String,
    start_time: u64,
}

lazy_static::lazy_static! {
    static ref WINDOW_TRACKER: Mutex<WindowTracker> = Mutex::new(WindowTracker {
        current_window: String::new(),
        start_time: current_timestamp(),
    });
}

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)  // Fallback to 0 if time is before epoch
}

#[tauri::command]
pub fn get_active_window_info() -> Result<ActiveWindowInfo, String> {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::{HWND, MAX_PATH};
        use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

        unsafe {
            let hwnd: HWND = GetForegroundWindow();
            if hwnd.0.is_null() {
                return Ok(ActiveWindowInfo {
                    name: "No active window".to_string(),
                    duration: 0,
                });
            }

            let mut buffer = [0u16; MAX_PATH as usize];
            let len = GetWindowTextW(hwnd, &mut buffer);

            let window_title = if len > 0 {
                String::from_utf16_lossy(&buffer[..len as usize])
            } else {
                "Unknown".to_string()
            };

            // Track window focus duration
            let mut tracker = WINDOW_TRACKER.lock()
                .map_err(|e| format!("Failed to acquire window tracker lock: {}", e))?;
            let current_time = current_timestamp();

            let duration = if tracker.current_window == window_title {
                // Same window, calculate elapsed time
                current_time.saturating_sub(tracker.start_time)
            } else {
                // Different window, reset tracking
                tracker.current_window = window_title.clone();
                tracker.start_time = current_time;
                0
            };

            Ok(ActiveWindowInfo {
                name: window_title,
                duration,
            })
        }
    }

    #[cfg(not(windows))]
    {
        Ok(ActiveWindowInfo {
            name: "Not supported on this platform".to_string(),
            duration: 0,
        })
    }
}
