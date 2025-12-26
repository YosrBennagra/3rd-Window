// Persistence Schemas
//
// This module defines all versioned schemas for persisted state.
// Every schema change increments the version and requires a migration.
//
// CRITICAL: Never remove or rename fields without providing a migration path.
// Schema evolution must be backward-compatible through migrations.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Current schema version - increment on any breaking change
pub const CURRENT_VERSION: u32 = 1;

/// Top-level persisted state with versioning
///
/// This is the only type that gets serialized to disk.
/// All persisted state flows through this versioned container.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PersistedState {
    /// Schema version for migration support
    pub version: u32,

    /// Application settings (window, monitor, fullscreen)
    pub app_settings: AppSettingsV1,

    /// Grid layout and widget positions
    pub layout: LayoutStateV1,

    /// User preferences (theme, refresh rate, etc.)
    pub preferences: PreferencesV1,
}

impl Default for PersistedState {
    fn default() -> Self {
        Self {
            version: CURRENT_VERSION,
            app_settings: AppSettingsV1::default(),
            layout: LayoutStateV1::default(),
            preferences: PreferencesV1::default(),
        }
    }
}

// ============================================================================
// APP SETTINGS V1
// ============================================================================

/// Application window and monitor settings (V1)
///
/// This controls window behavior, monitor selection, and fullscreen state.
/// Changes here require careful validation to avoid invalid window states.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettingsV1 {
    /// Whether the app is in fullscreen mode
    pub is_fullscreen: bool,

    /// Selected monitor index (validated on load)
    pub selected_monitor: usize,

    /// Whether window is always on top
    pub always_on_top: bool,

    /// Last known window position (for non-fullscreen restoration)
    pub window_position: Option<WindowPosition>,
}

impl Default for AppSettingsV1 {
    fn default() -> Self {
        Self {
            is_fullscreen: false,
            selected_monitor: 0,
            always_on_top: false,
            window_position: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

// ============================================================================
// LAYOUT STATE V1
// ============================================================================

/// Grid layout and widget positioning (V1)
///
/// This represents the dashboard layout. Widget types are validated against
/// known widget registry to prevent loading unknown/removed widget types.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LayoutStateV1 {
    /// Grid configuration (columns and rows)
    pub grid: GridConfig,

    /// Widget layouts on the grid
    pub widgets: Vec<WidgetLayout>,
}

impl Default for LayoutStateV1 {
    fn default() -> Self {
        Self { grid: GridConfig { columns: 24, rows: 12 }, widgets: vec![] }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GridConfig {
    pub columns: u32,
    pub rows: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WidgetLayout {
    /// Unique widget instance ID
    pub id: String,

    /// Widget type (e.g., "clock", "timer", "network-monitor")
    pub widget_type: String,

    /// Grid position
    pub x: u32,
    pub y: u32,

    /// Grid size
    pub width: u32,
    pub height: u32,

    /// Whether widget is locked (prevents drag/resize)
    pub locked: bool,

    /// Widget-specific settings (opaque JSON object)
    /// Each widget type defines its own settings schema
    #[serde(default)]
    pub settings: Option<serde_json::Value>,
}

// ============================================================================
// PREFERENCES V1
// ============================================================================

/// User preferences and UI settings (V1)
///
/// These are "soft" settings that control UI behavior but don't affect
/// core functionality. Corruption here is less critical than app_settings.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PreferencesV1 {
    /// UI theme
    pub theme: Theme,

    /// Power saving mode enabled
    pub power_saving: bool,

    /// Metrics refresh interval (milliseconds)
    pub refresh_interval: u64,

    /// Widget visibility overrides
    #[serde(default)]
    pub widget_visibility: HashMap<String, bool>,

    /// Widget scale overrides
    #[serde(default)]
    pub widget_scale: HashMap<String, WidgetScale>,

    /// Widget rendering order (Z-index)
    #[serde(default)]
    pub widget_order: Vec<String>,

    /// Alert rules
    #[serde(default)]
    pub alert_rules: Vec<AlertRule>,

    /// User notes (freeform text)
    #[serde(default)]
    pub notes: String,
}

impl Default for PreferencesV1 {
    fn default() -> Self {
        Self {
            theme: Theme::Auto,
            power_saving: false,
            refresh_interval: 8000,
            widget_visibility: HashMap::new(),
            widget_scale: HashMap::new(),
            widget_order: vec![],
            alert_rules: vec![],
            notes: String::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    Auto,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum WidgetScale {
    Small,
    Medium,
    Large,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AlertRule {
    pub id: String,
    pub metric: String,
    pub operator: String,
    pub threshold: f64,
    pub enabled: bool,
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

impl PersistedState {
    /// Validates the loaded state for correctness
    ///
    /// Returns a list of validation warnings (non-fatal issues).
    /// Fatal issues should be handled by recovery logic before this is called.
    pub fn validate(&self) -> Vec<String> {
        let mut warnings = Vec::new();

        // Validate version
        if self.version > CURRENT_VERSION {
            warnings.push(format!(
                "State was saved by newer version (v{}), current is v{}. Some data may be lost.",
                self.version, CURRENT_VERSION
            ));
        }

        // Validate grid dimensions
        if self.layout.grid.columns == 0 || self.layout.grid.rows == 0 {
            warnings.push("Invalid grid dimensions (zero columns or rows)".to_string());
        }

        if self.layout.grid.columns > 100 || self.layout.grid.rows > 100 {
            warnings.push(format!(
                "Unusually large grid ({}x{}), may impact performance",
                self.layout.grid.columns, self.layout.grid.rows
            ));
        }

        // Validate widgets are within grid bounds
        for widget in &self.layout.widgets {
            if widget.x + widget.width > self.layout.grid.columns
                || widget.y + widget.height > self.layout.grid.rows
            {
                warnings.push(format!(
                    "Widget '{}' ({}) is outside grid bounds",
                    widget.id, widget.widget_type
                ));
            }

            if widget.width == 0 || widget.height == 0 {
                warnings
                    .push(format!("Widget '{}' ({}) has zero size", widget.id, widget.widget_type));
            }
        }

        // Validate widget IDs are unique
        let mut seen_ids = std::collections::HashSet::new();
        for widget in &self.layout.widgets {
            if !seen_ids.insert(&widget.id) {
                warnings.push(format!("Duplicate widget ID: {}", widget.id));
            }
        }

        // Validate refresh interval is reasonable
        if self.preferences.refresh_interval < 1000 {
            warnings.push("Refresh interval < 1s may impact performance".to_string());
        }

        if self.preferences.refresh_interval > 60000 {
            warnings.push("Refresh interval > 60s may feel unresponsive".to_string());
        }

        warnings
    }

    /// Sanitizes the state to ensure it's safe to use
    ///
    /// This is called after validation to fix any non-fatal issues.
    /// Returns a sanitized copy of the state.
    pub fn sanitize(mut self) -> Self {
        // Clamp grid dimensions to reasonable values
        self.layout.grid.columns = self.layout.grid.columns.clamp(6, 100);
        self.layout.grid.rows = self.layout.grid.rows.clamp(4, 100);

        // Remove widgets outside bounds or with invalid dimensions
        self.layout.widgets.retain(|w| {
            w.width > 0
                && w.height > 0
                && w.x + w.width <= self.layout.grid.columns
                && w.y + w.height <= self.layout.grid.rows
        });

        // Deduplicate widget IDs (keep first occurrence)
        let mut seen_ids = std::collections::HashSet::new();
        self.layout.widgets.retain(|w| seen_ids.insert(w.id.clone()));

        // Clamp refresh interval to reasonable range (1s - 60s)
        self.preferences.refresh_interval = self.preferences.refresh_interval.clamp(1000, 60000);

        // Validate monitor index will be checked at runtime against available monitors

        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_state_is_valid() {
        let state = PersistedState::default();
        let warnings = state.validate();
        assert!(warnings.is_empty(), "Default state should have no warnings");
    }

    #[test]
    fn test_validate_detects_out_of_bounds_widgets() {
        let mut state = PersistedState::default();
        state.layout.widgets.push(WidgetLayout {
            id: "test".to_string(),
            widget_type: "clock".to_string(),
            x: 100, // Way outside 24-column grid
            y: 0,
            width: 4,
            height: 4,
            locked: false,
            settings: None,
        });

        let warnings = state.validate();
        assert!(!warnings.is_empty(), "Should detect out-of-bounds widget");
        assert!(warnings.iter().any(|w| w.contains("outside grid bounds")));
    }

    #[test]
    fn test_validate_detects_duplicate_ids() {
        let mut state = PersistedState::default();
        state.layout.widgets.push(WidgetLayout {
            id: "duplicate".to_string(),
            widget_type: "clock".to_string(),
            x: 0,
            y: 0,
            width: 4,
            height: 4,
            locked: false,
            settings: None,
        });
        state.layout.widgets.push(WidgetLayout {
            id: "duplicate".to_string(),
            widget_type: "timer".to_string(),
            x: 4,
            y: 0,
            width: 4,
            height: 4,
            locked: false,
            settings: None,
        });

        let warnings = state.validate();
        assert!(warnings.iter().any(|w| w.contains("Duplicate widget ID")));
    }

    #[test]
    fn test_sanitize_clamps_grid_dimensions() {
        let mut state = PersistedState::default();
        state.layout.grid.columns = 1000; // Too large
        state.layout.grid.rows = 2; // Too small

        let sanitized = state.sanitize();
        assert_eq!(sanitized.layout.grid.columns, 100); // Clamped to max
        assert_eq!(sanitized.layout.grid.rows, 4); // Clamped to min
    }

    #[test]
    fn test_sanitize_removes_invalid_widgets() {
        let mut state = PersistedState::default();
        state.layout.widgets.push(WidgetLayout {
            id: "valid".to_string(),
            widget_type: "clock".to_string(),
            x: 0,
            y: 0,
            width: 4,
            height: 4,
            locked: false,
            settings: None,
        });
        state.layout.widgets.push(WidgetLayout {
            id: "zero-size".to_string(),
            widget_type: "timer".to_string(),
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            locked: false,
            settings: None,
        });
        state.layout.widgets.push(WidgetLayout {
            id: "out-of-bounds".to_string(),
            widget_type: "notes".to_string(),
            x: 100,
            y: 100,
            width: 4,
            height: 4,
            locked: false,
            settings: None,
        });

        let sanitized = state.sanitize();
        assert_eq!(sanitized.layout.widgets.len(), 1);
        assert_eq!(sanitized.layout.widgets[0].id, "valid");
    }

    #[test]
    fn test_sanitize_deduplicates_widget_ids() {
        let mut state = PersistedState::default();
        state.layout.widgets.push(WidgetLayout {
            id: "keep-me".to_string(),
            widget_type: "clock".to_string(),
            x: 0,
            y: 0,
            width: 4,
            height: 4,
            locked: false,
            settings: None,
        });
        state.layout.widgets.push(WidgetLayout {
            id: "keep-me".to_string(),
            widget_type: "timer".to_string(),
            x: 4,
            y: 0,
            width: 4,
            height: 4,
            locked: false,
            settings: None,
        });

        let sanitized = state.sanitize();
        assert_eq!(sanitized.layout.widgets.len(), 1);
        assert_eq!(sanitized.layout.widgets[0].widget_type, "clock"); // First kept
    }

    #[test]
    fn test_sanitize_clamps_refresh_interval() {
        let mut state = PersistedState::default();
        state.preferences.refresh_interval = 100; // Too fast

        let sanitized = state.sanitize();
        assert_eq!(sanitized.preferences.refresh_interval, 1000);

        state.preferences.refresh_interval = 100000; // Too slow
        let sanitized = state.sanitize();
        assert_eq!(sanitized.preferences.refresh_interval, 60000);
    }

    #[test]
    fn test_round_trip_serialization() {
        let original = PersistedState::default();
        let json_result = serde_json::to_string(&original);
        assert!(json_result.is_ok(), "Serialization should succeed");

        let json = json_result.expect("Checked in previous assertion");
        let deserialize_result = serde_json::from_str::<PersistedState>(&json);
        assert!(deserialize_result.is_ok(), "Deserialization should succeed");

        let deserialized = deserialize_result.expect("Checked in previous assertion");

        assert_eq!(original.version, deserialized.version);
        assert_eq!(original.app_settings.is_fullscreen, deserialized.app_settings.is_fullscreen);
        assert_eq!(original.layout.grid.columns, deserialized.layout.grid.columns);
        assert_eq!(original.preferences.theme as u8, deserialized.preferences.theme as u8);
    }
}
