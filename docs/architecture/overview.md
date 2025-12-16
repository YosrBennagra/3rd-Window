# Architecture Overview

- Tauri shell (Rust): window management, always-on-top, power-saving/ambient toggles, command bridge to Rust/host APIs.
- Renderer (React/Svelte/etc.): widget host, settings, alert UI.
- Services: metrics collectors, notifications ingestion (system + third-party connectors), alert engine, settings store, shortcuts/launcher, pipeline status checks.
- IPC contracts: typed channels for metrics, alerts, settings, notifications, integrations, launcher.
- Optional MCP servers/agents: metrics, alerts, notifications exposed to background automation.
