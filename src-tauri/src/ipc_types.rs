// IPC Type Definitions
//
// This module defines all IPC contract types used in Tauri commands.
// Types here represent the explicit contracts between frontend and backend.

use serde::{Deserialize, Serialize};

// ============================================================================
// SETTINGS TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub is_fullscreen: bool,
    pub selected_monitor: usize,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self { is_fullscreen: false, selected_monitor: 0 }
    }
}

// ============================================================================
// MONITOR TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Monitor {
    pub identifier: Option<String>,
    pub name: String,
    pub size: MonitorSize,
    pub position: MonitorPosition,
    pub is_primary: bool,
    pub scale_factor: f64,
    pub refresh_rate: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonitorSize {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonitorPosition {
    pub x: i32,
    pub y: i32,
}

// ============================================================================
// WIDGET WINDOW TYPES
// ============================================================================

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

// ============================================================================
// SYSTEM METRICS TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SystemMetrics {
    pub cpu_usage: f32,
    pub cpu_temp: f32,
    pub gpu_temp: f32,
    pub memory_used: u64,
    pub memory_total: u64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkStats {
    pub interface_name: String,
    pub download_speed: u64,
    pub upload_speed: u64,
    pub total_downloaded: u64,
    pub total_uploaded: u64,
    pub is_connected: bool,
}

// ============================================================================
// WINDOW TRACKER TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ActiveWindowInfo {
    pub name: String,
    pub duration: u64,
}
