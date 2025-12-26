# Desktop UX — Important Notes & Future Improvements

Important Notes
- Non-intrusive behavior has been implemented: the dashboard may take focus when explicitly opened; desktop widgets and the picker do not steal focus on re-open.
- Blocking modal dialogs (e.g., `alert()`) have been removed — user-facing messages should be non-blocking.
- Accessibility groundwork is in place (reduced-motion support, many ARIA labels, focus styles). A final keyboard navigation verification is still required.

Prioritized Future Improvements

High Priority
- Complete full keyboard navigation and tab order across all windows (widgets, picker, dashboard). Run a keyboard-only walkthrough and fix remaining tab indices and focus traps.
- Implement a non-blocking toast/notification system to replace console-based or blocking error messages; expose a small API so services can report user-facing messages.
- Verify and finalize visible focus indicators across all interactive controls; perform an accessibility audit focused on `:focus-visible` states.

Medium Priority
- Add window position validation and monitor-disconnection handling so restored windows never appear off-screen.
- Define and document global keyboard shortcuts and provide an in-app shortcut reference.

Low Priority
- Add user theming and per-user animation preferences (extend `src/theme/global.css` variables and provide a theme selector).

Quick Verification Checklist (manual)
- Open dashboard → confirm it receives focus only when explicitly opened.
- Spawn and re-open widget picker → confirm it does not steal focus.
- Keyboard-only navigation: tab through picker and a sample widget; ensure visible focus and ARIA labels announce controls.

Where to Look Next
- UX principles and detailed guidance: `docs/dev/DESKTOP_UX_PRINCIPLES.md`
- Focus & visual styles: `src/theme/global.css`
- Window behavior logic: `src-tauri/src/system/window_manager.rs`

Next step options
- I can implement a toast prototype, or run a focused keyboard-accessibility pass and report remaining items — which do you prefer?
