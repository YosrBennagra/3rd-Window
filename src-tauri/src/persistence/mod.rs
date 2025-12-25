// Persistence Layer
//
// This module provides versioned, resilient state persistence with explicit
// schema management and migration support. It follows the principle of "safety
// over fidelity" - prefer safe defaults over exact restoration if data is
// corrupted or incompatible.
//
// Architecture:
// - Schemas are versioned and explicit
// - Migrations are incremental and testable
// - Corrupted data never blocks startup
// - IO is isolated from domain logic
// - Round-trip integrity is guaranteed

pub mod schemas;
pub mod storage;
pub mod migrations;
pub mod recovery;
pub mod compatibility;

pub use schemas::PersistedState;
pub use storage::{load_state, save_state};
pub use recovery::RecoveryMode;
