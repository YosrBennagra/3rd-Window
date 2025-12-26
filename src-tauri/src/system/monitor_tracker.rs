/**
 * Monitor Hot-Plug Event Detection
 * 
 * Detects monitor connect/disconnect events and notifies the frontend.
 * Following multi-monitor UX principles:
 * - Graceful handling of monitor changes
 * - Safe window recovery when monitors disconnect
 * - Notification system for frontend state updates
 */

use crate::ipc_types::Monitor;
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};

/// Monitor configuration change event
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum MonitorEvent {
    /// Monitor layout changed (connect, disconnect, reorder)
    ConfigurationChanged {
        monitors: Vec<Monitor>,
        previous_count: usize,
        current_count: usize,
    },
    /// Monitor was disconnected
    MonitorDisconnected {
        monitor_index: usize,
        monitor_name: String,
    },
    /// Monitor was connected
    MonitorConnected {
        monitor_index: usize,
        monitor_name: String,
    },
}

/// Monitor state tracker
pub struct MonitorTracker {
    last_count: Arc<Mutex<usize>>,
    last_config: Arc<Mutex<Vec<Monitor>>>,
}

impl MonitorTracker {
    pub fn new() -> Self {
        Self {
            last_count: Arc::new(Mutex::new(0)),
            last_config: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Check for monitor configuration changes
    pub async fn check_for_changes(&self, app: &AppHandle) -> Option<MonitorEvent> {
        let current_monitors = match self.get_current_monitors(app).await {
            Ok(monitors) => monitors,
            Err(e) => {
                warn!("[MonitorTracker] Failed to get monitors: {}", e);
                return None;
            }
        };

        let previous_count = match self.last_count.lock() {
            Ok(guard) => *guard,
            Err(poisoned) => {
                warn!("[MonitorTracker] Mutex poisoned, recovering: last_count");
                *poisoned.into_inner()
            }
        };
        let current_count = current_monitors.len();

        let last_config = match self.last_config.lock() {
            Ok(guard) => guard.clone(),
            Err(poisoned) => {
                warn!("[MonitorTracker] Mutex poisoned, recovering: last_config");
                poisoned.into_inner().clone()
            }
        };

        // Detect what changed
        let event = if current_count != previous_count {
            if current_count > previous_count {
                // Monitor added
                let new_monitor = &current_monitors[current_count - 1];
                info!(
                    "[MonitorTracker] Monitor connected: '{}' (index: {})",
                    new_monitor.name, current_count - 1
                );
                Some(MonitorEvent::MonitorConnected {
                    monitor_index: current_count - 1,
                    monitor_name: new_monitor.name.clone(),
                })
            } else {
                // Monitor removed
                let removed_index = previous_count - 1;
                let removed_name = last_config
                    .get(removed_index)
                    .map(|m| m.name.clone())
                    .unwrap_or_else(|| format!("Monitor {}", removed_index + 1));
                
                warn!(
                    "[MonitorTracker] Monitor disconnected: '{}' (index: {})",
                    removed_name, removed_index
                );
                Some(MonitorEvent::MonitorDisconnected {
                    monitor_index: removed_index,
                    monitor_name: removed_name,
                })
            }
        } else if !last_config.is_empty() && self.monitors_differ(&last_config, &current_monitors) {
            // Configuration changed (position, resolution, etc.)
            info!(
                "[MonitorTracker] Monitor configuration changed (count: {})",
                current_count
            );
            Some(MonitorEvent::ConfigurationChanged {
                monitors: current_monitors.clone(),
                previous_count,
                current_count,
            })
        } else {
            None
        };

        // Update tracking
        if let Ok(mut guard) = self.last_count.lock() {
            *guard = current_count;
        } else {
            warn!("[MonitorTracker] Failed to update last_count (mutex poisoned)");
        }
        
        if let Ok(mut guard) = self.last_config.lock() {
            *guard = current_monitors;
        } else {
            warn!("[MonitorTracker] Failed to update last_config (mutex poisoned)");
        }

        event
    }

    /// Get current monitor configuration
    async fn get_current_monitors(&self, app: &AppHandle) -> Result<Vec<Monitor>, String> {
        let monitors = app
            .available_monitors()
            .map_err(|e| format!("Failed to get monitors: {}", e))?;

        let primary = app
            .primary_monitor()
            .map_err(|e| format!("Failed to get primary: {}", e))?;

        let primary_id = primary.and_then(|m| m.name().map(|s| s.to_string()));

        let result = monitors
            .into_iter()
            .enumerate()
            .map(|(idx, m)| {
                let size = m.size();
                let position = m.position();
                let scale_factor = m.scale_factor();
                let identifier = m.name().map(|s| s.to_string());
                let is_primary = match (&identifier, &primary_id) {
                    (Some(current), Some(primary)) => current == primary,
                    (None, None) => idx == 0,
                    _ => false,
                };

                Monitor {
                    identifier: identifier.clone(),
                    name: identifier.unwrap_or_else(|| format!("Monitor {}", idx + 1)),
                    size: crate::ipc_types::MonitorSize {
                        width: size.width,
                        height: size.height,
                    },
                    position: crate::ipc_types::MonitorPosition {
                        x: position.x,
                        y: position.y,
                    },
                    is_primary,
                    scale_factor,
                    refresh_rate: None,
                }
            })
            .collect();

        Ok(result)
    }

    /// Check if monitor configurations are different
    fn monitors_differ(&self, a: &[Monitor], b: &[Monitor]) -> bool {
        if a.len() != b.len() {
            return true;
        }

        for (ma, mb) in a.iter().zip(b.iter()) {
            if ma.identifier != mb.identifier
                || ma.size.width != mb.size.width
                || ma.size.height != mb.size.height
                || ma.position.x != mb.position.x
                || ma.position.y != mb.position.y
                || (ma.scale_factor - mb.scale_factor).abs() > 0.01
            {
                return true;
            }
        }

        false
    }

    /// Start monitoring for changes (call periodically)
    pub async fn emit_if_changed(&self, app: &AppHandle) {
        if let Some(event) = self.check_for_changes(app).await {
            info!("[MonitorTracker] Emitting event: {:?}", event);
            
            // Emit to all webview windows
            if let Err(e) = app.emit("monitor-changed", &event) {
                warn!("[MonitorTracker] Failed to emit event: {}", e);
            }
        }
    }
}

impl Default for MonitorTracker {
    fn default() -> Self {
        Self::new()
    }
}

/// Initialize monitor tracking
pub fn init_monitor_tracking(app: &AppHandle) {
    let tracker = Arc::new(MonitorTracker::new());
    let app_handle = app.clone();

    // Store tracker in app state for access from commands
    app.manage(tracker.clone());

    // Start background polling for monitor changes
    tauri::async_runtime::spawn(async move {
        loop {
            tracker.emit_if_changed(&app_handle).await;
            
            // Poll every 2 seconds
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        }
    });

    info!("[MonitorTracker] Monitoring initialized");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_monitor(index: usize, width: u32, x: i32) -> Monitor {
        Monitor {
            identifier: Some(format!("DISPLAY{}", index + 1)),
            name: format!("Monitor {}", index + 1),
            size: crate::ipc_types::MonitorSize {
                width,
                height: 1080,
            },
            position: crate::ipc_types::MonitorPosition { x, y: 0 },
            is_primary: index == 0,
            scale_factor: 1.0,
            refresh_rate: Some(60),
        }
    }

    #[test]
    fn test_monitors_differ_by_size() {
        let tracker = MonitorTracker::new();
        let a = vec![create_test_monitor(0, 1920, 0)];
        let b = vec![create_test_monitor(0, 2560, 0)]; // Different width

        assert!(tracker.monitors_differ(&a, &b));
    }

    #[test]
    fn test_monitors_differ_by_position() {
        let tracker = MonitorTracker::new();
        let a = vec![create_test_monitor(0, 1920, 0)];
        let b = vec![create_test_monitor(0, 1920, 1920)]; // Different position

        assert!(tracker.monitors_differ(&a, &b));
    }

    #[test]
    fn test_monitors_same() {
        let tracker = MonitorTracker::new();
        let a = vec![create_test_monitor(0, 1920, 0)];
        let b = vec![create_test_monitor(0, 1920, 0)];

        assert!(!tracker.monitors_differ(&a, &b));
    }
}
