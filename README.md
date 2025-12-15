# Desktop Dashboard (Secondary Monitor)

A modular, always-on-top desktop dashboard for a secondary monitor with widgets for notifications, system metrics, calendar, notes, and prioritized alerts. Think Rainmeter + Notion widgets + system monitor + alert engine.

## Quickstart (placeholder)
- Install deps: see docs/dev/setup.md
- Run app: see docs/dev/running.md
- Build installers: see scripts/release-checklist.md

## Key Features
- Customizable widget grid (notifications, CPU/GPU temps, RAM, disk, network, clock, notes, alerts, shortcuts/launcher)
- Always-on-top mode (optional) plus power-saving ambient mode that blacks unused areas while keeping chosen widgets visible
- Alert rules with priority (info/warning/critical) and schedules
- Third-party notification connectors (opt-in) for Facebook, Messenger, WhatsApp, Slack, Discord, and pipeline status (e.g., n8n)
- Modular widget registry for extensibility

## Links
- Architecture: docs/architecture/overview.md
- UX: docs/ux/principles.md
- Alerts: docs/alerts/rules-language.md
- MCP/agents: mcp/README.md
