# Requirements

## Functional
- Widget host supports add/remove/reorder/resize of widgets.
- Widgets: notifications, CPU/GPU temps, RAM, disk, network, clock/calendar, notes, alerts, shortcuts/launcher, service-status (pipelines/integrations).
- Alert engine with severity levels, thresholds, schedules, actions (toast/sound/webhook).
- Always-on-top toggle; secondary-monitor targeting.
- Power saving/ambient mode: black background with only user-selected widgets visible; configurable timeout.
- Shortcuts/launcher widget: pin games/apps/files with quick launch.
- Third-party notification connectors (opt-in): Facebook, Messenger, WhatsApp, Slack, Discord; extensible connector model.
- Pipeline/automation status (e.g., n8n): show up/down and last run result.
- Settings persistence and import/export.
- Theming and density controls.

## Non-Functional
- Performance: idle CPU < 2%, memory footprint small; adaptive polling.
- Power: ambient mode minimizes GPU/CPU usage; pause non-essential polling when dimmed.
- Reliability: resilient metrics collection; fallback when sensors unavailable.
- Security: minimal IPC surface; no elevated permissions without need.
- Privacy: per-source consent for external connectors; store tokens securely/local-only.
- Accessibility: keyboard navigation, contrast, readable typography.

## Constraints
- Desktop focus (Windows/Mac/Linux) via Tauri shell.
- No permanent background services beyond app unless user opts in (agents optional).
