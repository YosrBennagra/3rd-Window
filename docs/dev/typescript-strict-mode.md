describe('formatBytes', () => {
  # TypeScript Strict Mode — Important Notes & Future Improvements

  This file contains only the critical notes you should know and a prioritized list of future improvements.

  - **Status:** ✅ Strict mode enabled across the repo; `npx tsc --noEmit` should report no errors.

  - **Critical notes:**
    - Two justified `@ts-expect-error` annotations remain for legacy widget compatibility; remove them when widgets are migrated.
    - Several places still use `as unknown as Record<string, unknown>` as a documented type-erasure pattern for settings — remove after migrating widget settings to typed schemas.
    - Branded types and IPC contracts are in place; removing legacy bridges too early will cause compile breaks.

  - **High-priority future improvements:**
    1. **Migrate core widgets (1–3 at a time):** convert `ClockWidget`, `TimerWidget`, and `RamUsageWidget` to `WidgetComponentProps` to eliminate bridge types and remove `@ts-expect-error` usages.
    2. **Add integration tests for IPC and stores:** create tests covering `src/services/ipc.ts` and one application store (recommended `desktopWidgetStore`) to prevent regressions when removing unsafe casts.
    3. **Incremental branded ID adoption:** replace string/number ID parameters with `WidgetInstanceId`/`MonitorId` in tests and internal helpers before public APIs.

  - **Medium-priority:**
    - Remove `as unknown as Record<string, unknown>` usages after migrating settings.
    - Publish a contributor migration checklist (registry → widget → remove bridge → `npx tsc`).

  - **Low-priority / optional:**
    - Add a lint rule to block new `any` / `@ts-ignore` usages in PRs.
    - Add CI validation that checks a small set of IPC payloads against backend Rust types.

  - **Recommended next action:** migrate `ClockWidget` and `TimerWidget`, then add one integration test for `ipc` + `desktopWidgetStore`.

  **Skills consulted:** `typescript-strict-mode`, `testability-design`.

  ---

  For full guidance and examples, see `docs/dev/TYPESCRIPT_STRICT_MODE_SUMMARY.md` and `docs/dev/typescript-strict-mode.md` (full implementation guide).
