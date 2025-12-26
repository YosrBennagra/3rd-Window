# Desktop UX Principles — Key Notes & Future Improvements

Purpose
- Concise summary of the essential UX rules already implemented and the high-impact next steps to complete desktop UX quality for ThirdScreen.

Important Notes You Should Know
- Focus discipline: Dashboard may take focus when explicitly opened; widgets and the picker do not steal focus on re-open. This is implemented in `src-tauri/src/system/window_manager.rs`.
- Modal discipline: All blocking `alert()`/`confirm()` calls removed. We must provide a non-blocking notification/toast API for user-facing errors.
- Accessibility groundwork: `prefers-reduced-motion`, focus styles, and many ARIA labels are added; however, keyboard navigation (tab order and focus traps) still needs final verification.
- Window restoration: Positions are persisted but need robust monitor-disconnection handling to avoid off-screen windows.

Prioritized Future Improvements

High Priority
- Complete full keyboard navigation and tab order across all windows (widgets, picker, dashboard). Perform a keyboard-only walkthrough and fix tab order/focus traps.
- Implement a non-blocking toast/notification system and a minimal API for services to report user-facing messages.
- Finalize and verify visible focus indicators (`:focus-visible`) across all interactive controls; run a focused accessibility audit.

Medium Priority
- Add window position validation and monitor-disconnection handling so restored windows never appear off-screen.
- Define and document global keyboard shortcuts and provide an in-app shortcut reference.
- Add a small acceptance test that replays key navigation flows (picker, sample widget, dashboard).

Low Priority
- User theming and per-user animation preferences (extend `src/theme/global.css` variables and add a theme selector).

Quick Verification Checklist (manual)
- Dashboard: opens and receives focus only when explicitly opened.
- Widget picker: re-open does not steal focus; Escape closes it.
- Keyboard navigation: tab through picker and one widget; confirm visible focus and ARIA labels announce controls.

Where to Look for Implementation Details
- Window focus & behavior: `src-tauri/src/system/window_manager.rs`
- Focus & visual styles: `src/theme/global.css`
- Widget lifecycle & error handling: `src/ui/components/widgets/WidgetErrorBoundary.tsx`
- IPC & notification hooks: `src/services/ipc.ts` (extend with a `notification` API when implementing toast)

Next Steps Recommendation
- I can prototype a minimal toast/notification service (UI + `IpcService` hook) or run a focused keyboard-accessibility pass and produce a small list of remaining tab-order issues. Which would you prefer me to implement next?
