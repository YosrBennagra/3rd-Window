# Desktop Dashboard App – A–Z Deliverable Map

This file captures the full stack of deliverables to take the desktop dashboard app (secondary-monitor widgets, alerts, always-on-top) from idea to production. Use it as the single checklist and index.

## Product and Strategy
- README.md: overview, value props, quickstart.
- docs/product-brief.md: problem, audience, jobs-to-be-done, success metrics.
- docs/personas.md: personas with goals and pains.
- docs/user-journeys.md: setup, widget customization, alert triage.
- docs/requirements.md: functional and non-functional requirements, priorities, constraints.
- docs/roadmap.md: milestones, themes, cut criteria.

## Architecture and Design
- docs/architecture/overview.md: system view and module boundaries.
- docs/architecture/component-diagram.drawio: app shell, widget host, data collectors, alert engine.
- docs/architecture/sequence-sync.drawio: data refresh, alert delivery flows.
- docs/architecture/state-model.md: app state, widget state, alert lifecycle.
- docs/architecture/data-contracts.md: widget API, alert schema, settings schema.
- docs/architecture/performance-budget.md: CPU/GPU budget, memory, update cadence.
- docs/architecture/security-model.md: sandboxing, IPC boundaries, permissions.

## UX and UI
- docs/ux/principles.md: always-visible rules, glanceability.
- docs/ux/wireframes.pdf: secondary-monitor layout, widget tray, settings panel.
- docs/ux/styleguide.md: typography, spacing, color tokens, elevation.
- docs/ux/widget-templates.md: notification, temperature, RAM, disk, network, clock, notes, alerts.
- docs/ux/accessibility.md: contrast, keyboarding, screen reader notes.

## Branding and Marketing
- docs/brand/identity.md: name options, voice, tone.
- docs/brand/logo-assets.md: logo usage, icon set references.
- docs/marketing/landing-copy.md: hero, features, trust, CTA.
- docs/marketing/store-listing.md: store metadata, screenshots, pricing.
- docs/marketing/press-kit.md: one-pager, FAQs, media assets.
- docs/marketing/release-notes-template.md: changelog pattern.

## Project Setup and Tooling
- package.json: scripts and dependencies (Tauri + web stack).
- tsconfig.json: TypeScript config.
- vite.config.ts or webpack.config.js: bundler config.
- .editorconfig: formatting rules.
- .gitignore: ignores.
- .github/workflows/ci.yml: lint, test, build.
- .github/workflows/release.yml: signing and artifact upload.
- .github/issue_template.md and .github/pull_request_template.md: contribution hygiene.

## Desktop App (Tauri example)
- src-tauri/tauri.conf.json: window, bundle, and dev server config.
- src-tauri/Cargo.toml: Rust crate config and Tauri dependencies.
- src-tauri/src/main.rs: shell entrypoint; register commands and window opts.

## App Frontend
- src/index.tsx: app bootstrap.
- src/App.tsx: layout and widget host.
- src/config/widgets.ts: registry of widget definitions and defaults.
- src/components/WidgetHost.tsx: layout, drag, drop, resize.
- src/components/WidgetFrame.tsx: chrome, priority badges, hover actions.
- src/components/widgets/Notifications.tsx
- src/components/widgets/Temperature.tsx
- src/components/widgets/RamUsage.tsx
- src/components/widgets/DiskUsage.tsx
- src/components/widgets/NetworkSpeed.tsx
- src/components/widgets/ClockCalendar.tsx
- src/components/widgets/Notes.tsx
- src/components/widgets/Alerts.tsx
- src/components/SettingsPanel.tsx: widget toggles, intervals, themes.
- src/components/AlertRulesEditor.tsx: thresholds, schedules, actions.
- src/state/store.ts: global state.
- src/state/selectors.ts: derived state.
- src/theme/tokens.ts: colors and spacing.
- src/theme/global.css: base styles.
- src/utils/system.ts: formatting helpers for bytes, temperatures, rates.

## Data Collection and Services
- src/services/system-metrics.ts: CPU and GPU temperatures, RAM, disk, network.
- src/services/notifications.ts: ingestion of app, system, and custom notifications.
- src/services/alerts.ts: rule evaluation, dedupe, priority routing.
- src/services/settings.ts: persistence, import and export.
- src/services/ipc-client.ts: typed IPC calls to main process.
- src/services/logging.ts: client logging hooks.

## Alerting and Rules
- docs/alerts/rules-language.md: conditions, operators, severity map.
- docs/alerts/examples.md: sample thresholds (temperature, RAM, disk, network).
- src/alerts/engine.ts: evaluation engine.
- src/alerts/channels.ts: toast, sound, webhook, email (optional).
- src/alerts/schedules.ts: quiet hours, recurrence.

## Packaging and Release
- Tauri bundler outputs: platform installers and code signing.
- scripts/signing.md: code signing steps.
- scripts/release-checklist.md: gates before ship.

## Security and Privacy
- docs/security/threat-model.md: assets and trust boundaries.
- docs/security/hardening.md: CSP, sandbox, IPC allowlist.
- docs/privacy/data-handling.md: stored data, retention, telemetry opt-in.

## Observability and QA
- docs/telemetry/events.md: event names and payloads.
- src/observability/telemetry.ts: client-side emitter.
- tests/e2e/setup.md: Playwright or Spectron setup.
- tests/e2e/smoke.spec.ts: launch, widget render, settings save.
- tests/unit/widgets.spec.ts: widget logic.
- tests/unit/alerts.spec.ts: rules and throttling.

## Operations and Support
- docs/support/runbook.md: common issues and triage steps.
- docs/support/faq.md: user-facing FAQs.
- docs/legal/license.md: license choice.
- docs/legal/terms.md and docs/legal/privacy.md: for broad distribution.

## GitHub Copilot and Prompting
- .github/copilot-instructions.md: repo-specific guidance (coding style, security rules, no secrets).
- .vscode/settings.json: enable inline completions and formatters.
- docs/prompts/dev-workflow.prompt.md: prompt for coding with IPC minimization and async collectors.
- docs/prompts/review.prompt.md: prompt for code review focus (performance, security, UX, accessibility).
- docs/prompts/alerts-tuning.prompt.md: prompt for alert rules and thresholds.

## MCP Servers and Agents
- mcp/README.md: how to run and register MCP servers.
- mcp/servers/system-metrics/server.ts: exposes CPU, GPU, RAM, disk, network metrics.
- mcp/servers/notifications/server.ts: streams notifications.
- mcp/servers/alerts/server.ts: manage alert rules via MCP.
- mcp/servers/settings/server.ts: read and write user settings.
- mcp/servers/openai/.env.example: API key template.
- mcp/prompts/agent-ops.md: instructions for agents calling MCP (rate limits, safety).
- mcp/prompts/agent-alert-curator.md: alert tuning behaviors.
- mcp/prompts/agent-copywriter.md: release notes and marketing text.
- mcp/config/agents.json: declares background agents and their scopes.
- mcp/security/permissions.md: allowed methods per agent.

## Background AI Agents (examples)
- Alert Curator Agent: watches telemetry, tunes thresholds via alerts server.
- Notification Summarizer Agent: summarizes high-volume notifications and writes highlights to notes widget.
- Release Copy Agent: drafts release notes from commit history; limited to marketing files.
- UX QA Agent: nightly screenshots, baseline diffing, files regressions report.

## Development Environment
- docs/dev/setup.md: Node version, package manager, native deps for sensors.
- docs/dev/running.md: scripts and environment variables.
- docs/dev/troubleshooting.md: common build and runtime issues.

## Data and Storage
- docs/data/storage-layout.md: local paths for settings and cache.
- docs/data/migrations.md: versioned migrations for settings and alerts.
- src/storage/index.ts: file, SQLite, or key-value choice.

## Performance and Battery
- docs/perf/sampling-strategy.md: polling intervals and adaptive backoff.
- docs/perf/load-testing.md: widget stress tests.

## Distribution
- docs/distribution/channels.md: direct download vs store; auto-update strategy.
- docs/distribution/pricing.md: free and pro tiers and gating (for example, webhooks).
