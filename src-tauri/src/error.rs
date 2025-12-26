/// Centralized error types for ThirdScreen backend
///
/// This module provides domain-specific error types that map low-level
/// errors to meaningful, user-safe messages following Rust safety principles.
use std::fmt;

/// Main error type for Tauri commands
#[derive(Debug)]
pub enum AppError {
    /// IO operation failed (file read/write, path operations)
    Io(std::io::Error),
    /// JSON serialization/deserialization failed
    Json(serde_json::Error),
    /// Window operation failed
    Window(String),
    /// Widget operation failed
    Widget(String),
    /// Mutex lock failed (poisoned)
    LockPoisoned(String),
    /// System call failed
    System(String),
    /// Resource not found
    NotFound(String),
    /// Resource already exists
    AlreadyExists(String),
    /// Validation error (invalid input)
    Validation(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Io(e) => write!(f, "File operation failed: {}", e),
            AppError::Json(e) => write!(f, "Data format error: {}", e),
            AppError::Window(msg) => write!(f, "Window operation failed: {}", msg),
            AppError::Widget(msg) => write!(f, "Widget operation failed: {}", msg),
            AppError::LockPoisoned(msg) => write!(f, "Internal synchronization error: {}", msg),
            AppError::System(msg) => write!(f, "System operation failed: {}", msg),
            AppError::NotFound(msg) => write!(f, "Resource not found: {}", msg),
            AppError::AlreadyExists(msg) => write!(f, "Resource already exists: {}", msg),
            AppError::Validation(msg) => write!(f, "Validation error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Json(err)
    }
}

impl<T> From<std::sync::PoisonError<T>> for AppError {
    fn from(err: std::sync::PoisonError<T>) -> Self {
        AppError::LockPoisoned(err.to_string())
    }
}

/// Convert AppError to String for Tauri IPC
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}

/// Convenience type alias for Results in commands
#[allow(dead_code)]
pub type AppResult<T> = Result<T, AppError>;
