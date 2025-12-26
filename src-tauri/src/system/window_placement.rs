/**
 * Multi-Monitor Window Placement Service
 *
 * Implements safe, predictable window placement across multi-monitor setups.
 * Following multi-monitor UX principles:
 * - Monitor-aware by default
 * - Predictable placement
 * - Safe fallbacks when monitors disconnect
 * - DPI-aware positioning
 */
use crate::error::AppError;
use crate::ipc_types::Monitor;
use log::{info, warn};
use serde::{Deserialize, Serialize};
use tauri::{PhysicalPosition, PhysicalSize, Position, Runtime, Size, WebviewWindow};

/// Window placement request with target monitor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPlacement {
    pub monitor_index: usize,
    pub relative_x: Option<f64>, // 0.0-1.0, relative to monitor
    pub relative_y: Option<f64>, // 0.0-1.0, relative to monitor
    pub width: Option<u32>,
    pub height: Option<u32>,
}

/// Result of window placement operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlacementResult {
    pub monitor_index: usize,
    pub fallback_used: bool,
    pub reason: Option<String>,
}

/// Safe window placement with fallback logic
pub struct WindowPlacer {
    monitors: Vec<Monitor>,
}

impl WindowPlacer {
    pub fn new(monitors: Vec<Monitor>) -> Self {
        Self { monitors }
    }

    /// Validate monitor index is within bounds
    #[allow(dead_code)]
    pub fn validate_monitor_index(&self, index: usize) -> Result<(), AppError> {
        if index >= self.monitors.len() {
            return Err(AppError::Validation(format!(
                "Monitor index {} out of range (0-{})",
                index,
                self.monitors.len().saturating_sub(1)
            )));
        }
        Ok(())
    }

    /// Get monitor at index, with fallback to primary
    pub fn get_monitor_safe(&self, index: usize) -> (&Monitor, bool) {
        match self.monitors.get(index) {
            Some(monitor) => (monitor, false),
            None => {
                warn!("Monitor index {} not found, falling back to primary", index);
                let primary_idx = self.find_primary_index();
                let primary = &self.monitors[primary_idx];
                (primary, true)
            },
        }
    }

    /// Find primary monitor index
    pub fn find_primary_index(&self) -> usize {
        self.monitors.iter().position(|m| m.is_primary).unwrap_or(0)
    }

    /// Calculate safe window position on target monitor
    pub fn calculate_position(
        &self,
        monitor: &Monitor,
        relative_x: Option<f64>,
        relative_y: Option<f64>,
    ) -> PhysicalPosition<i32> {
        let rel_x = relative_x.unwrap_or(0.05); // Default: 5% from left
        let rel_y = relative_y.unwrap_or(0.05); // Default: 5% from top

        // Clamp to 0.0-1.0 range
        let clamped_x = rel_x.max(0.0).min(1.0);
        let clamped_y = rel_y.max(0.0).min(1.0);

        PhysicalPosition {
            x: monitor.position.x + (monitor.size.width as f64 * clamped_x) as i32,
            y: monitor.position.y + (monitor.size.height as f64 * clamped_y) as i32,
        }
    }

    /// Calculate safe window size for target monitor
    pub fn calculate_size(
        &self,
        monitor: &Monitor,
        requested_width: Option<u32>,
        requested_height: Option<u32>,
    ) -> PhysicalSize<u32> {
        let max_width = (monitor.size.width as f64 * 0.9) as u32; // Max 90% of monitor
        let max_height = (monitor.size.height as f64 * 0.9) as u32;

        let width = requested_width
            .unwrap_or((monitor.size.width as f64 * 0.8) as u32)
            .min(max_width)
            .max(400); // Minimum 400px

        let height = requested_height
            .unwrap_or((monitor.size.height as f64 * 0.8) as u32)
            .min(max_height)
            .max(300); // Minimum 300px

        PhysicalSize { width, height }
    }

    /// Ensure window is fully visible on target monitor
    pub fn clamp_to_monitor_bounds(
        &self,
        monitor: &Monitor,
        position: PhysicalPosition<i32>,
        size: PhysicalSize<u32>,
    ) -> PhysicalPosition<i32> {
        let mon_left = monitor.position.x;
        let mon_top = monitor.position.y;
        let mon_right = mon_left + monitor.size.width as i32;
        let mon_bottom = mon_top + monitor.size.height as i32;

        let win_right = position.x + size.width as i32;
        let win_bottom = position.y + size.height as i32;

        let clamped_x = if win_right > mon_right {
            mon_right - size.width as i32
        } else {
            position.x.max(mon_left)
        };

        let clamped_y = if win_bottom > mon_bottom {
            mon_bottom - size.height as i32
        } else {
            position.y.max(mon_top)
        };

        PhysicalPosition { x: clamped_x, y: clamped_y }
    }

    /// Place window on target monitor with safe fallback
    pub async fn place_window<R: Runtime>(
        &self,
        window: &WebviewWindow<R>,
        placement: WindowPlacement,
    ) -> Result<PlacementResult, AppError> {
        let (monitor, fallback_used) = self.get_monitor_safe(placement.monitor_index);

        info!(
            "[WindowPlacer] Placing window on monitor '{}' (index: {}, fallback: {})",
            monitor.name, placement.monitor_index, fallback_used
        );

        // Calculate position and size
        let position = self.calculate_position(monitor, placement.relative_x, placement.relative_y);
        let size = self.calculate_size(monitor, placement.width, placement.height);

        // Clamp to monitor bounds
        let safe_position = self.clamp_to_monitor_bounds(monitor, position, size);

        // Apply to window
        window
            .set_position(Position::Physical(safe_position))
            .map_err(|e| AppError::Window(format!("Failed to set position: {}", e)))?;

        window
            .set_size(Size::Physical(size))
            .map_err(|e| AppError::Window(format!("Failed to set size: {}", e)))?;

        let reason = if fallback_used {
            Some(format!(
                "Monitor {} not available, using primary monitor",
                placement.monitor_index
            ))
        } else {
            None
        };

        Ok(PlacementResult { monitor_index: placement.monitor_index, fallback_used, reason })
    }

    /// Move window between monitors preserving relative position
    pub async fn move_to_monitor<R: Runtime>(
        &self,
        window: &WebviewWindow<R>,
        target_index: usize,
        preserve_relative: bool,
    ) -> Result<PlacementResult, AppError> {
        let (target_monitor, _fallback_used) = self.get_monitor_safe(target_index);

        info!(
            "[WindowPlacer] Moving window to monitor '{}' (preserve_relative: {})",
            target_monitor.name, preserve_relative
        );

        let (relative_x, relative_y) = if preserve_relative {
            // Try to preserve relative position from current monitor
            self.get_relative_position(window).await?
        } else {
            (Some(0.05), Some(0.05)) // Default placement
        };

        self.place_window(
            window,
            WindowPlacement {
                monitor_index: target_index,
                relative_x,
                relative_y,
                width: None, // Keep current size
                height: None,
            },
        )
        .await
    }

    /// Get window's relative position on current monitor
    async fn get_relative_position<R: Runtime>(
        &self,
        window: &WebviewWindow<R>,
    ) -> Result<(Option<f64>, Option<f64>), AppError> {
        let current_pos = window
            .outer_position()
            .map_err(|e| AppError::Window(format!("Failed to get position: {}", e)))?;

        // Find which monitor contains this position
        let current_monitor = self
            .monitors
            .iter()
            .find(|m| self.contains_point(m, current_pos.x, current_pos.y))
            .ok_or_else(|| AppError::Window("Window not on any monitor".to_string()))?;

        let rel_x =
            (current_pos.x - current_monitor.position.x) as f64 / current_monitor.size.width as f64;
        let rel_y = (current_pos.y - current_monitor.position.y) as f64
            / current_monitor.size.height as f64;

        Ok((Some(rel_x), Some(rel_y)))
    }

    /// Check if a point is within monitor bounds
    fn contains_point(&self, monitor: &Monitor, x: i32, y: i32) -> bool {
        x >= monitor.position.x
            && x < monitor.position.x + monitor.size.width as i32
            && y >= monitor.position.y
            && y < monitor.position.y + monitor.size.height as i32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_monitor(index: usize, is_primary: bool) -> Monitor {
        Monitor {
            identifier: Some(format!("DISPLAY{}", index + 1)),
            name: format!("Monitor {}", index + 1),
            size: MonitorSize { width: 1920, height: 1080 },
            position: MonitorPosition { x: (index as i32) * 1920, y: 0 },
            is_primary,
            scale_factor: 1.0,
            refresh_rate: Some(60),
        }
    }

    #[test]
    fn test_validate_monitor_index() {
        let monitors = vec![create_test_monitor(0, true), create_test_monitor(1, false)];
        let placer = WindowPlacer::new(monitors);

        assert!(placer.validate_monitor_index(0).is_ok());
        assert!(placer.validate_monitor_index(1).is_ok());
        assert!(placer.validate_monitor_index(2).is_err());
    }

    #[test]
    fn test_get_monitor_safe_fallback() {
        let monitors = vec![create_test_monitor(0, true), create_test_monitor(1, false)];
        let placer = WindowPlacer::new(monitors);

        let (monitor, fallback) = placer.get_monitor_safe(5);
        assert!(fallback);
        assert!(monitor.is_primary);
    }

    #[test]
    fn test_calculate_position() {
        let monitor = create_test_monitor(1, false);
        let placer = WindowPlacer::new(vec![monitor.clone()]);

        let pos = placer.calculate_position(&monitor, Some(0.5), Some(0.5));
        assert_eq!(pos.x, 1920 + 960); // Second monitor, center
        assert_eq!(pos.y, 540); // Center vertically
    }

    #[test]
    fn test_calculate_size_respects_limits() {
        let monitor = create_test_monitor(0, true);
        let placer = WindowPlacer::new(vec![monitor.clone()]);

        // Request too large
        let size = placer.calculate_size(&monitor, Some(5000), Some(5000));
        assert!(size.width <= 1920);
        assert!(size.height <= 1080);

        // Request too small
        let size = placer.calculate_size(&monitor, Some(100), Some(100));
        assert!(size.width >= 400);
        assert!(size.height >= 300);
    }
}
