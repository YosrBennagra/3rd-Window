use log::info;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

const DEFAULT_VERSION: u8 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GridConfig {
    pub columns: u8,
    pub rows: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WidgetLayout {
    pub id: String,
    pub widget_type: String,
    pub x: u8,
    pub y: u8,
    pub width: u8,
    pub height: u8,
    #[serde(default)]
    pub locked: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub settings: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayoutState {
    pub grid: GridConfig,
    pub widgets: Vec<WidgetLayout>,
    pub version: u8,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WidgetSlot {
    pub id: Option<String>,
    pub x: u8,
    pub y: u8,
    pub width: u8,
    pub height: u8,
    #[serde(default)]
    pub locked: Option<bool>,
    #[serde(default)]
    pub settings: Option<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum LayoutOperation {
    AddWidget {
        widget_type: String,
        layout: WidgetSlot,
    },
    MoveWidget {
        id: String,
        x: u8,
        y: u8,
    },
    ResizeWidget {
        id: String,
        width: u8,
        height: u8,
        #[serde(default)]
        x: Option<u8>,
        #[serde(default)]
        y: Option<u8>,
    },
    RemoveWidget {
        id: String,
    },
    SetWidgetLock {
        id: String,
        locked: bool,
    },
    SetWidgetSettings {
        id: String,
        settings: Value,
    },
}

#[derive(Debug, Clone)]
pub struct WidgetConstraints {
    pub min_width: u8,
    pub min_height: u8,
    pub max_width: u8,
    pub max_height: u8,
}

fn default_settings_for(widget_type: &str) -> Option<Value> {
    match widget_type {
        "clock" => Some(json!({
            "timeFormat": "12h",
            "showSeconds": true,
            "dateFormat": "long",
            "layoutStyle": "stacked",
            "alignment": "center",
            "fontSizeMode": "auto",
            "timezone": "system",
            "updateFrequency": "second",
            "clickBehavior": "open-system-clock",
            "minGridSize": { "width": 3, "height": 2 }
        })),
        _ => None,
    }
}

fn merge_settings(defaults: Value, overrides: Option<Value>) -> Value {
    match (defaults, overrides) {
        (Value::Object(mut base), Some(Value::Object(overrides))) => {
            for (key, value) in overrides {
                base.insert(key, value);
            }
            Value::Object(base)
        }
        (_defaults, Some(Value::Object(overrides))) => {
            let mut base = serde_json::Map::new();
            for (key, value) in overrides {
                base.insert(key, value);
            }
            Value::Object(base)
        }
        (defaults, Some(value)) if value.is_null() => defaults,
        (_, Some(value)) => value,
        (defaults, None) => defaults,
    }
}

fn apply_widget_defaults(widget: &mut WidgetLayout) {
    if let Some(defaults) = default_settings_for(&widget.widget_type) {
        let merged = merge_settings(defaults, widget.settings.clone());
        widget.settings = Some(merged);
    } else if widget.settings.is_none() {
        widget.settings = None;
    }
}

#[derive(Debug)]
pub enum LayoutError {
    UnknownWidget(String),
    UnknownId(String),
    Collision(String),
    OutOfBounds(String),
    InvalidSize(String),
    Locked(String),
}

impl std::fmt::Display for LayoutError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LayoutError::UnknownWidget(id) => write!(f, "Unknown widget type: {}", id),
            LayoutError::UnknownId(id) => write!(f, "Widget not found: {}", id),
            LayoutError::Collision(msg) => write!(f, "Collision: {}", msg),
            LayoutError::OutOfBounds(msg) => write!(f, "Out of bounds: {}", msg),
            LayoutError::InvalidSize(msg) => write!(f, "Invalid size: {}", msg),
            LayoutError::Locked(id) => write!(f, "Widget is locked: {}", id),
        }
    }
}

impl std::error::Error for LayoutError {}

#[derive(Debug, Clone)]
pub struct WidgetRegistry {
    constraints: HashMap<String, WidgetConstraints>,
}

impl WidgetRegistry {
    pub fn new() -> Self {
        let mut constraints = HashMap::new();
        constraints.insert(
            "notifications".to_string(),
            WidgetConstraints {
                min_width: 6,
                min_height: 4,
                max_width: 24,
                max_height: 12,
            },
        );
        constraints.insert(
            "mail".to_string(),
            WidgetConstraints {
                min_width: 6,
                min_height: 4,
                max_width: 24,
                max_height: 12,
            },
        );
        constraints.insert(
            "clock".to_string(),
            WidgetConstraints {
                min_width: 3,
                min_height: 2,
                max_width: 12,
                max_height: 8,
            },
        );
        Self { constraints }
    }

    pub fn constraints_for(&self, widget_type: &str) -> Option<&WidgetConstraints> {
        self.constraints.get(widget_type)
    }
}

#[derive(Debug, Clone)]
pub struct CollisionDetector {
    columns: u8,
    rows: u8,
}

impl CollisionDetector {
    pub fn new(columns: u8, rows: u8) -> Self {
        Self { columns, rows }
    }

    fn within_bounds(
        &self,
        layout: &WidgetLayout,
        constraints: &WidgetConstraints,
    ) -> Result<(), LayoutError> {
        if layout.width < constraints.min_width || layout.height < constraints.min_height {
            return Err(LayoutError::InvalidSize(format!(
                "{} is smaller than min size {}x{}",
                layout.id, constraints.min_width, constraints.min_height
            )));
        }

        if layout.width > constraints.max_width || layout.height > constraints.max_height {
            return Err(LayoutError::InvalidSize(format!(
                "{} exceeds max size {}x{}",
                layout.id, constraints.max_width, constraints.max_height
            )));
        }

        if layout.x + layout.width > self.columns || layout.y + layout.height > self.rows {
            return Err(LayoutError::OutOfBounds(format!(
                "{} would leave the grid ({}x{} at {},{})",
                layout.id, layout.width, layout.height, layout.x, layout.y
            )));
        }

        Ok(())
    }

    fn overlaps(a: &WidgetLayout, b: &WidgetLayout) -> bool {
        !(a.x >= b.x + b.width
            || a.x + a.width <= b.x
            || a.y >= b.y + b.height
            || a.y + a.height <= b.y)
    }

    fn collides(&self, widgets: &[WidgetLayout], candidate: &WidgetLayout) -> bool {
        widgets
            .iter()
            .filter(|existing| existing.id != candidate.id)
            .any(|existing| Self::overlaps(existing, candidate))
    }
}

#[derive(Debug)]
pub struct GridManager {
    grid: GridConfig,
    collision: CollisionDetector,
    registry: WidgetRegistry,
    widgets: Vec<WidgetLayout>,
    last_valid: Vec<WidgetLayout>,
    version: u8,
}

impl GridManager {
    pub fn new(columns: u8, rows: u8, registry: WidgetRegistry) -> Self {
        let collision = CollisionDetector::new(columns, rows);
        let grid = GridConfig { columns, rows };
        let widgets = Vec::new();
        Self {
            grid,
            collision,
            registry,
            widgets: widgets.clone(),
            last_valid: widgets,
            version: DEFAULT_VERSION,
        }
    }

    fn state(&self) -> LayoutState {
        LayoutState {
            grid: self.grid.clone(),
            widgets: self.widgets.clone(),
            version: self.version,
        }
    }

    fn validate_with(
        &self,
        universe: &[WidgetLayout],
        layout: &WidgetLayout,
    ) -> Result<(), LayoutError> {
        let constraints = self
            .registry
            .constraints_for(&layout.widget_type)
            .ok_or_else(|| LayoutError::UnknownWidget(layout.widget_type.clone()))?;

        self.collision.within_bounds(layout, constraints)?;

        if self.collision.collides(universe, layout) {
            return Err(LayoutError::Collision(layout.id.clone()));
        }

        Ok(())
    }

    pub fn set_widgets(&mut self, widgets: Vec<WidgetLayout>) {
        let mut next = Vec::new();
        for mut widget in widgets {
            apply_widget_defaults(&mut widget);
            if self.validate_with(&next, &widget).is_ok() {
                next.push(widget);
            }
        }
        self.widgets = next.clone();
        self.last_valid = next;
    }

    fn upsert_widget(&mut self, mut widget: WidgetLayout) -> Result<LayoutState, LayoutError> {
        apply_widget_defaults(&mut widget);
        self.validate_with(&self.widgets, &widget)?;

        let mut next = Vec::new();
        let mut replaced = false;
        for existing in self.widgets.iter() {
            if existing.id == widget.id {
                next.push(widget.clone());
                replaced = true;
            } else {
                next.push(existing.clone());
            }
        }

        if !replaced {
            next.push(widget.clone());
        }

        self.widgets = next.clone();
        self.last_valid = next;
        Ok(self.state())
    }

    fn remove_widget(&mut self, id: &str) -> Result<LayoutState, LayoutError> {
        let before = self.widgets.len();
        self.widgets.retain(|w| w.id != id);
        if self.widgets.len() == before {
            return Err(LayoutError::UnknownId(id.to_string()));
        }

        self.last_valid = self.widgets.clone();
        Ok(self.state())
    }

    pub fn apply_operation(
        &mut self,
        operation: LayoutOperation,
    ) -> Result<LayoutState, LayoutError> {
        let snapshot = self.widgets.clone();

        let result = match operation {
            LayoutOperation::AddWidget {
                widget_type,
                layout,
            } => {
                let settings = layout
                    .settings
                    .clone()
                    .or_else(|| default_settings_for(&widget_type));
                let id = layout
                    .id
                    .unwrap_or_else(|| format!("{}-{}", widget_type, Uuid::new_v4()));
                let widget = WidgetLayout {
                    id,
                    widget_type,
                    x: layout.x,
                    y: layout.y,
                    width: layout.width,
                    height: layout.height,
                    locked: layout.locked.unwrap_or(false),
                    settings,
                };
                self.upsert_widget(widget)
            }
            LayoutOperation::MoveWidget { id, x, y } => {
                let mut widget = self
                    .widgets
                    .iter()
                    .find(|w| w.id == id)
                    .cloned()
                    .ok_or_else(|| LayoutError::UnknownId(id.clone()))?;
                if widget.locked {
                    return Err(LayoutError::Locked(id));
                }
                widget.x = x;
                widget.y = y;
                self.upsert_widget(widget)
            }
            LayoutOperation::ResizeWidget { id, width, height, x, y } => {
                let mut widget = self
                    .widgets
                    .iter()
                    .find(|w| w.id == id)
                    .cloned()
                    .ok_or_else(|| LayoutError::UnknownId(id.clone()))?;
                if widget.locked {
                    return Err(LayoutError::Locked(id));
                }
                widget.width = width;
                widget.height = height;
                if let Some(next_x) = x {
                    widget.x = next_x;
                }
                if let Some(next_y) = y {
                    widget.y = next_y;
                }
                self.upsert_widget(widget)
            }
            LayoutOperation::RemoveWidget { id } => self.remove_widget(&id),
            LayoutOperation::SetWidgetLock { id, locked } => {
                let mut widget = self
                    .widgets
                    .iter()
                    .find(|w| w.id == id)
                    .cloned()
                    .ok_or_else(|| LayoutError::UnknownId(id.clone()))?;
                widget.locked = locked;
                self.upsert_widget(widget)
            }
            LayoutOperation::SetWidgetSettings { id, settings } => {
                let mut widget = self
                    .widgets
                    .iter()
                    .find(|w| w.id == id)
                    .cloned()
                    .ok_or_else(|| LayoutError::UnknownId(id.clone()))?;
                widget.settings = Some(settings);
                self.upsert_widget(widget)
            }
        };

        match result {
            Ok(state) => Ok(state),
            Err(err) => {
                self.widgets = snapshot;
                Err(err)
            }
        }
    }

    pub fn replace_state(&mut self, state: LayoutState) {
        self.grid = state.grid.clone();
        self.collision = CollisionDetector::new(state.grid.columns, state.grid.rows);
        self.registry = WidgetRegistry::new();
        self.version = state.version;
        self.set_widgets(state.widgets);
    }
}

fn default_widgets(grid: &GridConfig) -> Vec<WidgetLayout> {
    vec![
        WidgetLayout {
            id: "notifications-demo".to_string(),
            widget_type: "notifications".to_string(),
            x: 0,
            y: 0,
            width: 6,
            height: 4,
            locked: false,
            settings: None,
        },
        WidgetLayout {
            id: "clock-demo".to_string(),
            widget_type: "clock".to_string(),
            x: grid.columns.saturating_sub(4),
            y: 0,
            width: 4,
            height: 2,
            locked: false,
            settings: default_settings_for("clock"),
        },
    ]
}

pub struct LayoutService {
    manager: Mutex<GridManager>,
}

impl LayoutService {
    pub fn new(columns: u8, rows: u8) -> Self {
        let grid = GridConfig { columns, rows };
        let registry = WidgetRegistry::new();
        let mut manager = GridManager::new(columns, rows, registry);
        manager.set_widgets(default_widgets(&grid));
        Self {
            manager: Mutex::new(manager),
        }
    }

    fn dashboard_path(&self, app: &AppHandle) -> Result<PathBuf, String> {
        app.path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))
            .map(|mut path| {
                path.push("dashboard.json");
                path
            })
    }

    fn read_from_disk(&self, app: &AppHandle) -> Result<LayoutState, String> {
        let path = self.dashboard_path(app)?;
        if !path.exists() {
            return Ok(self.manager.lock().unwrap().state());
        }

        let json =
            fs::read_to_string(&path).map_err(|e| format!("Failed to read dashboard: {}", e))?;
        let state: LayoutState =
            serde_json::from_str(&json).map_err(|e| format!("Failed to parse dashboard: {}", e))?;
        Ok(state)
    }

    fn write_to_disk(&self, app: &AppHandle, state: &LayoutState) -> Result<(), String> {
        let path = self.dashboard_path(app)?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create dashboard directory: {}", e))?;
        }

        let json = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Failed to serialize dashboard: {}", e))?;
        fs::write(&path, json).map_err(|e| format!("Failed to write dashboard: {}", e))
    }

    pub fn load(&self, app: &AppHandle) -> Result<LayoutState, String> {
        let disk_state = self.read_from_disk(app);
        match disk_state {
            Ok(state) => {
                let mut manager = self.manager.lock().unwrap();
                manager.replace_state(state.clone());
                info!("[layout] loaded {} widgets", state.widgets.len());
                Ok(manager.state())
            }
            Err(err) => {
                info!("[layout] falling back to defaults: {}", err);
                Ok(self.manager.lock().unwrap().state())
            }
        }
    }

    pub fn snapshot(&self) -> LayoutState {
        self.manager.lock().unwrap().state()
    }

    pub fn apply_operation(
        &self,
        app: &AppHandle,
        operation: LayoutOperation,
    ) -> Result<LayoutState, String> {
        let mut manager = self.manager.lock().unwrap();
        let state = manager
            .apply_operation(operation)
            .map_err(|e| e.to_string())?;
        self.write_to_disk(app, &state)?;
        Ok(state)
    }

    pub fn import(&self, app: &AppHandle, state: LayoutState) -> Result<LayoutState, String> {
        let mut manager = self.manager.lock().unwrap();
        manager.replace_state(state);
        let snapshot = manager.state();
        self.write_to_disk(app, &snapshot)?;
        Ok(snapshot)
    }
}
