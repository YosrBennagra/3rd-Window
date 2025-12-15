# State Model

- App state: window settings (always-on-top, monitor target), theme, density, power-saving mode (on/off, timeout, visible widgets).
- Widget state: layout, size, visibility, per-widget config (intervals, thresholds).
- Launcher state: pinned shortcuts (label, target path/URL/icon, last launched).
- Alert state: rules, active alerts, history, snoozed/acknowledged flags.
- Integration state: per-connector opt-in, tokens/keys stored locally, sync/last-success timestamps.
- Data caches: recent metrics, notifications, network samples, pipeline status results.
- Persistence: stored locally with migrations; export/import supported.
