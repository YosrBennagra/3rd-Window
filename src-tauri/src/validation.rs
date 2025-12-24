/// Input Validation Module for IPC Commands
/// 
/// Validates all inputs from frontend before processing.
/// Following IPC Contract Principles:
/// - All IPC inputs are validated on the backend
/// - Frontend data is never trusted implicitly
/// - Validation errors are explicit and user-safe

use crate::ipc_types::WidgetWindowConfig;

/// Validation error with context
#[derive(Debug)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Validation error in '{}': {}", self.field, self.message)
    }
}

impl From<ValidationError> for String {
    fn from(err: ValidationError) -> String {
        err.to_string()
    }
}

/// Validate widget ID format
pub fn validate_widget_id(widget_id: &str) -> Result<(), ValidationError> {
    if widget_id.is_empty() {
        return Err(ValidationError {
            field: "widgetId".to_string(),
            message: "Must not be empty".to_string(),
        });
    }

    if widget_id.len() > 100 {
        return Err(ValidationError {
            field: "widgetId".to_string(),
            message: "Too long (max 100 characters)".to_string(),
        });
    }

    // Only allow alphanumeric, hyphens, and underscores
    if !widget_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err(ValidationError {
            field: "widgetId".to_string(),
            message: "Must contain only alphanumeric characters, hyphens, and underscores".to_string(),
        });
    }

    Ok(())
}

/// Validate widget type
pub fn validate_widget_type(widget_type: &str) -> Result<(), ValidationError> {
    if widget_type.is_empty() {
        return Err(ValidationError {
            field: "widgetType".to_string(),
            message: "Must not be empty".to_string(),
        });
    }

    if widget_type.len() > 50 {
        return Err(ValidationError {
            field: "widgetType".to_string(),
            message: "Too long (max 50 characters)".to_string(),
        });
    }

    Ok(())
}

/// Validate monitor index
pub fn validate_monitor_index(index: usize) -> Result<(), ValidationError> {
    if index > 10 {
        return Err(ValidationError {
            field: "monitorIndex".to_string(),
            message: "Exceeds reasonable limit (max 10)".to_string(),
        });
    }

    Ok(())
}

/// Validate coordinates
pub fn validate_coordinates(x: i32, y: i32) -> Result<(), ValidationError> {
    if x.abs() > 100000 {
        return Err(ValidationError {
            field: "x".to_string(),
            message: "Out of reasonable range (-100000 to 100000)".to_string(),
        });
    }

    if y.abs() > 100000 {
        return Err(ValidationError {
            field: "y".to_string(),
            message: "Out of reasonable range (-100000 to 100000)".to_string(),
        });
    }

    Ok(())
}

/// Validate dimensions
pub fn validate_dimensions(width: u32, height: u32) -> Result<(), ValidationError> {
    if width == 0 || height == 0 {
        return Err(ValidationError {
            field: "dimensions".to_string(),
            message: "Width and height must be positive".to_string(),
        });
    }

    if width > 10000 || height > 10000 {
        return Err(ValidationError {
            field: "dimensions".to_string(),
            message: "Exceeds reasonable maximum (10000x10000)".to_string(),
        });
    }

    // Minimum sizes for usability
    if width < 50 || height < 50 {
        return Err(ValidationError {
            field: "dimensions".to_string(),
            message: "Too small (minimum 50x50)".to_string(),
        });
    }

    Ok(())
}

/// Validate complete widget window config
pub fn validate_widget_config(config: &WidgetWindowConfig) -> Result<(), ValidationError> {
    validate_widget_id(&config.widget_id)?;
    validate_widget_type(&config.widget_type)?;
    validate_coordinates(config.x, config.y)?;
    validate_dimensions(config.width, config.height)?;

    if let Some(monitor_index) = config.monitor_index {
        validate_monitor_index(monitor_index)?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_widget_id_valid() {
        assert!(validate_widget_id("widget-123").is_ok());
        assert!(validate_widget_id("my_widget_id").is_ok());
        assert!(validate_widget_id("test-widget-1").is_ok());
    }

    #[test]
    fn test_validate_widget_id_invalid() {
        assert!(validate_widget_id("").is_err());
        assert!(validate_widget_id(&"x".repeat(101)).is_err());
        assert!(validate_widget_id("widget@123").is_err());
        assert!(validate_widget_id("widget space").is_err());
    }

    #[test]
    fn test_validate_coordinates_valid() {
        assert!(validate_coordinates(0, 0).is_ok());
        assert!(validate_coordinates(1920, 1080).is_ok());
        assert!(validate_coordinates(-100, -100).is_ok());
    }

    #[test]
    fn test_validate_coordinates_invalid() {
        assert!(validate_coordinates(100001, 0).is_err());
        assert!(validate_coordinates(0, -100001).is_err());
    }

    #[test]
    fn test_validate_dimensions_valid() {
        assert!(validate_dimensions(100, 100).is_ok());
        assert!(validate_dimensions(800, 600).is_ok());
    }

    #[test]
    fn test_validate_dimensions_invalid() {
        assert!(validate_dimensions(0, 100).is_err());
        assert!(validate_dimensions(100, 0).is_err());
        assert!(validate_dimensions(10001, 100).is_err());
        assert!(validate_dimensions(100, 10001).is_err());
        assert!(validate_dimensions(10, 10).is_err()); // Too small
    }
}
