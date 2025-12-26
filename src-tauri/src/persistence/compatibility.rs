// Version Compatibility Checker
//
// Ensures safe updates by validating version compatibility.
// Prevents data loss from incompatible state formats.
//
// Distribution Awareness Principle:
// "Updates Must Be Safe" - Never break existing user setups.

use super::schemas::CURRENT_VERSION;

/// Version compatibility result
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompatibilityStatus {
    /// Versions are fully compatible (same version)
    FullyCompatible,

    /// Minor version difference - migration available
    MigrationAvailable,

    /// Major version difference - migration may be lossy
    MigrationRisky,

    /// State from future version - can't migrate backward
    FutureVersion,

    /// Too many versions apart - migration not safe
    Incompatible,
}

/// Check if a persisted state version is compatible with current app
///
/// Returns compatibility status to guide recovery strategy.
pub fn check_compatibility(state_version: u32) -> CompatibilityStatus {
    let version_diff = if state_version > CURRENT_VERSION {
        // State from future version
        return CompatibilityStatus::FutureVersion;
    } else {
        CURRENT_VERSION - state_version
    };

    match version_diff {
        0 => CompatibilityStatus::FullyCompatible,
        1..=2 => CompatibilityStatus::MigrationAvailable,
        3..=5 => CompatibilityStatus::MigrationRisky,
        _ => CompatibilityStatus::Incompatible,
    }
}

/// Check if migration is safe
///
/// Returns true if we can confidently migrate without data loss.
#[allow(dead_code)]
pub fn is_safe_to_migrate(state_version: u32) -> bool {
    matches!(
        check_compatibility(state_version),
        CompatibilityStatus::FullyCompatible | CompatibilityStatus::MigrationAvailable
    )
}

/// Check if state is from future version
///
/// Future versions require special handling - we can't migrate backward.
#[allow(dead_code)]
pub fn is_future_version(state_version: u32) -> bool {
    state_version > CURRENT_VERSION
}

/// Get human-readable compatibility message
///
/// Useful for logging and user notifications.
pub fn get_compatibility_message(state_version: u32) -> String {
    match check_compatibility(state_version) {
        CompatibilityStatus::FullyCompatible => {
            format!("State version {} matches current version", state_version)
        },
        CompatibilityStatus::MigrationAvailable => {
            format!(
                "State version {} can be safely migrated to v{}",
                state_version, CURRENT_VERSION
            )
        },
        CompatibilityStatus::MigrationRisky => {
            format!(
                "State version {} is {} versions old. Migration may lose some data. Current: v{}",
                state_version,
                CURRENT_VERSION - state_version,
                CURRENT_VERSION
            )
        },
        CompatibilityStatus::FutureVersion => {
            format!(
                "State is from newer version (v{}) than current (v{}). Using compatibility mode.",
                state_version, CURRENT_VERSION
            )
        },
        CompatibilityStatus::Incompatible => {
            format!(
                "State version {} is too old to migrate safely (current: v{}). Reset recommended.",
                state_version, CURRENT_VERSION
            )
        },
    }
}

/// Minimum supported version for migration
///
/// States older than this will be reset instead of migrated.
/// This prevents complex/risky migrations that could fail.
///
/// Update this when dropping support for old versions.
pub const MIN_SUPPORTED_VERSION: u32 = 1;

/// Check if version is supported
#[allow(dead_code)]
pub fn is_version_supported(state_version: u32) -> bool {
    (MIN_SUPPORTED_VERSION..=CURRENT_VERSION + 5).contains(&state_version)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_same_version_is_compatible() {
        assert_eq!(check_compatibility(CURRENT_VERSION), CompatibilityStatus::FullyCompatible);
    }

    #[test]
    fn test_one_version_old_has_migration() {
        if CURRENT_VERSION > 1 {
            assert_eq!(
                check_compatibility(CURRENT_VERSION - 1),
                CompatibilityStatus::MigrationAvailable
            );
        }
    }

    #[test]
    fn test_future_version_detected() {
        assert_eq!(check_compatibility(CURRENT_VERSION + 1), CompatibilityStatus::FutureVersion);
    }

    #[test]
    fn test_very_old_version_incompatible() {
        assert_eq!(
            check_compatibility(1),
            CompatibilityStatus::FullyCompatible // v1 is current
        );

        // When we reach v10, v1 should be incompatible
        if CURRENT_VERSION >= 10 {
            assert_eq!(
                check_compatibility(CURRENT_VERSION - 10),
                CompatibilityStatus::Incompatible
            );
        }
    }

    #[test]
    fn test_safe_migration_range() {
        assert!(is_safe_to_migrate(CURRENT_VERSION));
        assert!(is_safe_to_migrate(CURRENT_VERSION.saturating_sub(1)));
        assert!(!is_safe_to_migrate(CURRENT_VERSION + 1));
    }
}
