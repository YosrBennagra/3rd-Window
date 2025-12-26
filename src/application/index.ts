/**
 * Application Layer - Barrel Export
 * 
 * The application layer coordinates between the UI and domain layers.
 * It contains:
 * - Services: Business logic coordination and infrastructure orchestration
 * - Stores: Application-wide state management (Zustand)
 * - Hooks: Reusable React stateful logic
 */

// Services
export * from './services';

// Stores
export * from './stores';

// Hooks
export * from './hooks';

// Selectors (if any exist at root level)
export * from './selectors';
