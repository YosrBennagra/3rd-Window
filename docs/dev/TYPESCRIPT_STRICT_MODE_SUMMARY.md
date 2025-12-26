
# TypeScript Strict Mode — Important Notes & Future Improvements

- **Status:** ✅ Completed (strict mode enabled; `npx tsc --noEmit` reports no errors).
- **Critical notes you should know:**
  - 2 justified `@ts-expect-error` remain for legacy widget compatibility; these are documented and must be removed when widgets migrate.
  - IPC contracts and branded types are in place; removing legacy bridges too early will cause compile breaks until migration is staged.

- **High-priority future improvements (recommended order):**
  - **Migrate core widgets:** convert 2–3 high-value widgets (recommended `ClockWidget`, `TimerWidget`, `RamUsageWidget`) to the new `WidgetComponentProps` API to remove bridge types and eliminate `@ts-expect-error` usages.
  - **Add integration tests for IPC and stores:** cover `src/services/ipc.ts` and one application store (recommended `desktopWidgetStore`) to prevent regressions when removing legacy casting patterns.
  - **Adopt branded IDs incrementally:** replace `string`/`number` IDs with `WidgetInstanceId` / `MonitorId` in public APIs, starting with internal helper libs and tests.
  - **Test branded type factories & guards:** add unit tests for `src/types/branded.ts` factories and type guards to lock in behavior.

- **Medium-priority improvements:**
  - Remove remaining `as unknown as Record<string, unknown>` patterns after migrating widget settings to typed schemas.
  - Document a lightweight migration checklist for contributors (step-by-step: update registry → migrate widget → remove bridge → run `npx tsc`).

- **Low-priority / optional:**
  - Add a lint rule to flag new `any`/`@ts-ignore` usages in PRs.
  - Add CI integration tests that validate a small set of IPC payloads against backend types.

- **Next immediate action I recommend:** migrate `ClockWidget` and `TimerWidget` first, then add one integration test for `ipc`/`desktopWidgetStore`.

**Skills considered and consulted:** `typescript-strict-mode`, `testability-design`.

---

This file now contains only the essential notes and prioritized future work. For full implementation details, see `docs/dev/typescript-strict-mode.md`.
