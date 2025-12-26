describe('formatBytes', () => {
describe('Grid Store Workflow', () => {
describe('Monitor Integration', () => {
# Testing — Important Notes & Future Improvements

Important Notes
- Core test infrastructure is in place: Vitest + React Testing Library, deterministic time utilities, and mocks for IPC and Zustand.
- Domain layer is well-covered and intentionally the primary testing focus; application-layer (stores) has fewer integration tests and is the highest-impact area to improve.
- CI runs unit tests; Rust backend tests live under `src-tauri` and should be run independently.

High-Priority Next Steps
- Add integration tests for remaining stores to raise application-layer coverage toward ~60%.
- Add a small set of E2E tests for critical user flows (widget creation, restore, picker interactions) to catch cross-layer regressions.
- Integrate lightweight visual regression or snapshot checks for critical UI components to detect visual regressions early.

Medium-Priority Next Steps
- Introduce mutation testing (Stryker) on key domain modules to validate test robustness.
- Add performance benches (Vitest bench) for hot-path functions.

Low-Priority / Backlog
- Add pre-commit test gating for fast checks (lint + quick unit tests).
- Add optional visual test integrations (Percy/Chromatic) when CI budget allows.

Quick Validation Checklist
- `npm run test:run` — run unit suite locally.  
- `cd src-tauri && cargo test` — run backend tests.  
- Spot-check one end-to-end flow (picker → add widget → restore) manually or via E2E.

Where to Look
- Test setup & mocks: `src/test/setup.ts`, `src/test/mocks/`  
- Integration tests: `src/application/stores/*.integration.test.ts`  
- CI config: repository CI workflow files

Next step options
- I can add integration tests for one specific store (concrete PR), or prototype a minimal E2E for widget creation — which do you prefer?

