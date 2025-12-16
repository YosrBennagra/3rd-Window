# Copilot Instructions

## Architecture Snapshot
- ThirdScreen is a React 18 + Zustand UI in [src/](src) packaged as a Tauri v2 desktop shell defined in [src-tauri/src/lib.rs](src-tauri/src/lib.rs); keep UI logic in TypeScript and OS integrations in Rust commands.
- App boot ([src/App.tsx](src/App.tsx)) loads saved window prefs via `useStore.loadSettings()` and enumerates monitors via `loadMonitors()` before rendering [src/components/layout/DraggableGrid.tsx](src/components/layout/DraggableGrid.tsx) and the overlay settings panel.
- Commands must be registered in `tauri::Builder::invoke_handler` inside [src-tauri/src/lib.rs](src-tauri/src/lib.rs); existing handlers: `save_settings`, `load_settings`, `toggle_fullscreen`, `apply_fullscreen`, `get_monitors`, `move_to_monitor`, `get_system_temps`.

## State & Settings
- There are three Zustand stores: `useStore` in [src/store.ts](src/store.ts) for window/monitor preferences, `useGridStore` in [src/store/gridStore.ts](src/store/gridStore.ts) for the draggable grid, and `useAppStore` in [src/state/store.ts](src/state/store.ts) for the future widget/alert system. Pick the right store before mutating state.
- `useStore` methods wrap Tauri commands via `@tauri-apps/api/core/invoke`; update state optimistically, call the command, persist via `save_settings`, and revert on failure (see `setFullscreen` and `setSelectedMonitor`).
- Monitor changes exit fullscreen, call `move_to_monitor`, wait for window settling, then re-enter fullscreen; reuse that sequence to prevent the “stuck fullscreen” bug.

## Widgets & Layout
- The shipping UI uses [src/components/layout/DraggableGrid.tsx](src/components/layout/DraggableGrid.tsx) backed by [src/store/gridStore.ts](src/store/gridStore.ts) (`GRID_COLS`/`GRID_ROWS` = 6). Dragging/resizing rely on pointer events, `gridRef`, and `updateWidgetPositionWithPush`; extend these helpers rather than reimplementing collision checks.
- Widget React components live in [src/components/widgets/](src/components/widgets) and are mapped via the `widgetComponents` record inside `DraggableGrid`. Add new widgets there plus defaults through `useGridStore.addWidget`.
- `WidgetHost` in [src/components/WidgetHost.tsx](src/components/WidgetHost.tsx) and `widgetDefinitions` in [src/config/widgets.ts](src/config/widgets.ts) form a planned config-driven system; they remain unused because their persistence pipeline in [src/state/store.ts](src/state/store.ts) depends on a not-yet-built storage service. Treat them as experimental scaffolding.

## Services & Metrics
- Frontend services live in [src/services/](src/services). `system-metrics.ts` expects a `get_system_metrics` Tauri command and falls back to zeros when unavailable; align with the Rust side (only `get_system_temps` exists today) before consuming new fields.
- Alerts, notifications, shortcuts, integrations, and pipelines are currently stub fetchers used by `useAppStore.refreshAll()`; confirm their data contracts before surfacing values in UI.

## Developer Workflow
- Primary commands: `npm install`, `npm run tauri:dev` for the desktop dev loop, `npm run tauri:build` for installers, and `npm run dev:ui` / `npm run build:ui` for browser-only work (see [docs/dev/running.md](docs/dev/running.md)).
- Node 20+, Rust toolchain, and Tauri prerequisites are required (see [docs/dev/setup.md](docs/dev/setup.md)). If the window is blank, restart `npm run tauri:dev` to rebind port 5173 per [docs/dev/troubleshooting.md](docs/dev/troubleshooting.md).

## Guardrails & References
- Follow the 120-step roadmap in [TODO.md](TODO.md) and log wins in [PROGRESS.md](PROGRESS.md) before expanding scope.
- Styling lives in [src/App.css](src/App.css) and [src/components/layout/DraggableGrid.css](src/components/layout/DraggableGrid.css); preserve the glassmorphism theme (blurred translucent panels, smooth 200–300ms transitions).
- When modifying Tauri, keep logic in Rust modules and expose typed structs (e.g., `AppSettings`, `Monitor`) with `#[serde(rename_all = "camelCase")]` to stay aligned with the TypeScript mirrors under [src/types/system.ts](src/types/system.ts).
- Security/performance: never expose new Tauri commands without validation, avoid tight polling (default refresh is 8s in `useAppStore.refreshInterval`), and batch hardware queries where possible.
