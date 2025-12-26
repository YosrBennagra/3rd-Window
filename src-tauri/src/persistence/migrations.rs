// Migration System
//
// This module handles schema evolution through incremental migrations.
// Each migration is a function that transforms state from version N to N+1.
//
// Migrations are:
// - Explicit (one function per version bump)
// - Incremental (v1 -> v2 -> v3, not v1 -> v3)
// - Testable (pure functions with clear inputs/outputs)
// - Logged (we track which migrations were applied)
//
// When adding a new migration:
// 1. Increment CURRENT_VERSION in schemas.rs
// 2. Add a new migrate_vN_to_vN+1() function
// 3. Add it to the migration chain in apply_migrations()
// 4. Write tests for the migration

use super::compatibility::{check_compatibility, get_compatibility_message, CompatibilityStatus};
use super::schemas::{PersistedState, CURRENT_VERSION};

/// Applies all necessary migrations to bring state to current version
///
/// This function chains migrations from the loaded version to CURRENT_VERSION.
/// Each migration is applied in sequence, with validation between steps.
///
/// Returns:
/// - Ok(state) if all migrations succeeded
/// - Err(msg) if any migration failed
pub fn apply_migrations(mut state: PersistedState) -> Result<PersistedState, String> {
    let start_version = state.version;

    if start_version == CURRENT_VERSION {
        // No migration needed
        return Ok(state);
    }

    // Check compatibility before attempting migration
    let compat_status = check_compatibility(start_version);
    let compat_msg = get_compatibility_message(start_version);

    log::info!("{}", compat_msg);

    match compat_status {
        CompatibilityStatus::FullyCompatible => {
            // Already handled above, but explicit case for clarity
            return Ok(state);
        }
        CompatibilityStatus::FutureVersion => {
            // State from future version - we can't migrate backward
            log::warn!(
                "State is from newer version (v{}) than current (v{}). Using best-effort compatibility.",
                start_version,
                CURRENT_VERSION
            );
            // Don't error - let validation/sanitization handle incompatibilities
            return Ok(state);
        }
        CompatibilityStatus::Incompatible => {
            // Too old to migrate safely
            return Err(format!(
                "State version {} is too old to migrate (minimum supported: {})",
                start_version,
                super::compatibility::MIN_SUPPORTED_VERSION
            ));
        }
        CompatibilityStatus::MigrationRisky => {
            log::warn!(
                "Migration from v{} to v{} may be lossy. Proceeding with caution.",
                start_version,
                CURRENT_VERSION
            );
            // Continue but with extra logging
        }
        CompatibilityStatus::MigrationAvailable => {
            // Safe to migrate - this is the happy path
            log::info!(
                "Safe migration available from v{} to v{}",
                start_version,
                CURRENT_VERSION
            );
        }
    }

    log::info!(
        "Migrating state from v{} to v{}",
        start_version,
        CURRENT_VERSION
    );

    // Apply migrations in sequence
    // When adding new versions, add migration steps here
    let _current_version = start_version;

    // Example migration chain (currently just v1):
    // if current_version == 1 {
    //     state = migrate_v1_to_v2(state)?;
    //     current_version = 2;
    // }
    // if current_version == 2 {
    //     state = migrate_v2_to_v3(state)?;
    //     current_version = 3;
    // }

    // Ensure version is updated
    state.version = CURRENT_VERSION;

    log::info!(
        "Migration complete: v{} -> v{} ({} step(s))",
        start_version,
        CURRENT_VERSION,
        CURRENT_VERSION - start_version
    );

    Ok(state)
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================
//
// Each function migrates from version N to N+1.
// Migrations should be:
// - Conservative (prefer safe defaults over data loss)
// - Documented (explain what changed and why)
// - Testable (pure functions)
//
// Example migration:
//
// fn migrate_v1_to_v2(mut state: PersistedState) -> Result<PersistedState, String> {
//     // V2 added a new field "theme_variant" to preferences
//     // Default to "standard" for existing users
//
//     // In V2 schema, this would be handled by serde(default)
//     // This migration documents the intent
//
//     log::info!("Migrating v1 -> v2: Adding theme_variant field");
//     state.version = 2;
//     Ok(state)
// }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_no_migration_needed_for_current_version() {
        let state = PersistedState::default();
        assert_eq!(state.version, CURRENT_VERSION);

        let result = apply_migrations(state.clone());
        assert!(result.is_ok());
        let migrated = result.expect("Migration should succeed");
        assert_eq!(migrated.version, CURRENT_VERSION);
    }

    #[test]
    fn test_future_version_doesnt_error() {
        let mut state = PersistedState::default();
        state.version = CURRENT_VERSION + 10; // From the future

        let result = apply_migrations(state);
        assert!(result.is_ok(), "Should not error on future version");
    }
}
