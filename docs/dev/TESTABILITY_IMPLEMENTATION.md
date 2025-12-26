

# Testability — Important Notes & Future Improvements

Important Notes
- Core test infrastructure is in place: Vitest + RTL, mocks for IPC and Zustand, and deterministic time utilities.
- Domain logic is well-extracted and fully unit-tested; application-layer coverage (stores/integration) is intentionally lower and targeted for improvement.
- CI runs fast unit tests; Rust backend tests exist separately under `src-tauri`.

High-Priority Next Steps
- Add integration tests for remaining stores to raise application-layer coverage to ~60%.
- Add a small set of E2E tests for critical user flows (widget creation, restore, picker interactions).
- Integrate lightweight visual regression or snapshot checks for critical UI components.

Medium-Priority Next Steps
- Add performance benchmarks for hot-path functions (Vitest bench).  
- Introduce mutation testing for key domain modules (Stryker) to validate test robustness.

Low-Priority / Backlog
- Add pre-commit test gating for fast checks (lint + unit tests).  
- Add optional visual test integrations (Percy/Chromatic) when CI resources permit.

Quick Validation Checklist (manual)
- Run `npm run test:run` to ensure unit suite passes locally.  
- Run `cd src-tauri && cargo test` for backend verification.  
- Spot-check 3 cross-layer flows (store integration + UI glue) to validate behavior.

Where to Look
- Test setup & mocks: `src/test/setup.ts`, `src/test/mocks/`  
- Integration tests: `src/application/stores/*.integration.test.ts`  
- CI config: repository CI workflow files

Would you like me to (a) add integration tests for one store as a concrete next change, or (b) prototype a minimal E2E test for the widget creation flow? 
