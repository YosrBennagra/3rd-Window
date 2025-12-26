// Recovery System
//
// This module handles recovery from corrupted or invalid persisted state.
// The principle is: **never crash due to bad persisted data**.
//
// Recovery strategies:
// 1. Validation + Sanitization (fix minor issues)
// 2. Partial recovery (keep good parts, discard bad parts)
// 3. Safe defaults (reset to known-good state)
//
// Recovery is logged so users/developers can diagnose issues.

use super::schemas::PersistedState;

/// Recovery mode indicates how state was recovered
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RecoveryMode {
    /// No recovery needed - state loaded cleanly
    Clean,

    /// State was sanitized but fully usable
    Sanitized,

    /// Partial recovery - some data was discarded
    Partial,

    /// Complete reset - state was unusable
    Reset,
}

/// Result of recovery operation
pub struct RecoveryResult {
    /// The recovered state (always safe to use)
    pub state: PersistedState,

    /// How the state was recovered
    pub mode: RecoveryMode,

    /// Human-readable recovery report
    pub report: Vec<String>,
}

impl RecoveryResult {
    /// Creates a clean recovery (no issues)
    pub fn clean(state: PersistedState) -> Self {
        Self { state, mode: RecoveryMode::Clean, report: vec![] }
    }

    /// Creates a sanitized recovery (minor fixes applied)
    pub fn sanitized(state: PersistedState, issues: Vec<String>) -> Self {
        Self { state, mode: RecoveryMode::Sanitized, report: issues }
    }

    /// Creates a partial recovery (some data lost)
    pub fn partial(state: PersistedState, issues: Vec<String>) -> Self {
        Self { state, mode: RecoveryMode::Partial, report: issues }
    }

    /// Creates a reset recovery (full reset to defaults)
    pub fn reset(reason: String) -> Self {
        Self {
            state: PersistedState::default(),
            mode: RecoveryMode::Reset,
            report: vec![reason],
        }
    }
}

/// Attempts to recover persisted state
///
/// This is the main entry point for recovery logic. It tries increasingly
/// aggressive recovery strategies until the state is safe to use.
///
/// Recovery never fails - worst case is a full reset to defaults.
pub fn recover_state(state: Option<PersistedState>) -> RecoveryResult {
    match state {
        None => {
            // No state file - first run
            log::info!("No persisted state found, using defaults (first run)");
            RecoveryResult::reset("No previous state (first run)".to_string())
        },
        Some(state) => {
            // Validate the loaded state
            let warnings = state.validate();

            if warnings.is_empty() {
                // State is perfectly valid
                log::info!("Persisted state loaded successfully (v{})", state.version);
                RecoveryResult::clean(state)
            } else {
                // State has issues - try to sanitize
                log::warn!("Persisted state has issues, attempting recovery...");
                for warning in &warnings {
                    log::warn!("  - {}", warning);
                }

                let sanitized = state.sanitize();
                let post_warnings = sanitized.validate();

                if post_warnings.is_empty() {
                    // Sanitization fixed all issues
                    log::info!("State sanitized successfully");
                    RecoveryResult::sanitized(sanitized, warnings)
                } else {
                    // Some issues remain - partial recovery
                    log::warn!("Partial recovery - some data may be lost");
                    RecoveryResult::partial(sanitized, post_warnings)
                }
            }
        },
    }
}

/// Checks if recovery is successful enough to use
///
/// Returns false only if we should consider the recovery a failure
/// (though even failures provide safe defaults).
#[allow(dead_code)]
pub fn is_recovery_acceptable(result: &RecoveryResult) -> bool {
    match result.mode {
        RecoveryMode::Clean => true,
        RecoveryMode::Sanitized => true,
        RecoveryMode::Partial => {
            // Partial recovery is acceptable if critical data is intact
            // Check if app settings are present
            result.state.app_settings.selected_monitor == 0 // Primary monitor
        },
        RecoveryMode::Reset => true, // Reset is always safe
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::persistence::schemas::WidgetLayout;

    #[test]
    fn test_recover_none_gives_reset() {
        let result = recover_state(None);
        assert_eq!(result.mode, RecoveryMode::Reset);
        assert_eq!(result.state.version, crate::persistence::schemas::CURRENT_VERSION);
    }

    #[test]
    fn test_recover_valid_state_is_clean() {
        let state = PersistedState::default();
        let result = recover_state(Some(state));
        assert_eq!(result.mode, RecoveryMode::Clean);
        assert!(result.report.is_empty());
    }

    #[test]
    fn test_recover_invalid_grid_sanitizes() {
        let mut state = PersistedState::default();
        state.layout.grid.columns = 1000; // Too large
        state.layout.grid.rows = 1; // Too small

        let result = recover_state(Some(state));
        assert!(
            result.mode == RecoveryMode::Sanitized || result.mode == RecoveryMode::Partial,
            "Should sanitize invalid grid"
        );
        assert_eq!(result.state.layout.grid.columns, 100); // Clamped
        assert_eq!(result.state.layout.grid.rows, 4); // Clamped
    }

    #[test]
    fn test_recover_out_of_bounds_widgets() {
        let mut state = PersistedState::default();
        state.layout.widgets.push(WidgetLayout {
            id: "bad".to_string(),
            widget_type: "clock".to_string(),
            x: 100,
            y: 100,
            width: 4,
            height: 4,
            locked: false,
            settings: None,
        });

        let result = recover_state(Some(state));
        assert!(result.mode == RecoveryMode::Sanitized || result.mode == RecoveryMode::Partial);
        assert_eq!(result.state.layout.widgets.len(), 0, "Bad widget should be removed");
    }

    #[test]
    fn test_all_recovery_modes_are_acceptable() {
        let clean = RecoveryResult::clean(PersistedState::default());
        assert!(is_recovery_acceptable(&clean));

        let sanitized =
            RecoveryResult::sanitized(PersistedState::default(), vec!["test".to_string()]);
        assert!(is_recovery_acceptable(&sanitized));

        let partial = RecoveryResult::partial(PersistedState::default(), vec!["test".to_string()]);
        assert!(is_recovery_acceptable(&partial));

        let reset = RecoveryResult::reset("test".to_string());
        assert!(is_recovery_acceptable(&reset));
    }
}
