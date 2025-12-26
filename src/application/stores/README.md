# Store Architecture

This directory contains the application state layer using Zustand.

## Store Responsibilities

Following **Zustand Architecture Best Practices**, we have separated stores by concern:

### `store.ts` - Application Settings & Monitors
- **Responsibility**: App-level settings (fullscreen, monitor selection)
- **Persistent State**: Settings are persisted
- **Runtime State**: Monitor list
- **Used By**: App.tsx, SettingsPanel.tsx, DraggableGrid.tsx

### `gridStore.ts` - Grid Layout & Widgets
- **Responsibility**: Dashboard grid layout and widget state
- **Persistent State**: Widget layouts, positions, settings
- **Runtime State**: Drag state, resize state
- **Used By**: DraggableGrid.tsx, all grid-based components

### `desktopWidgetStore.ts` - Desktop Widgets
- **Responsibility**: Floating desktop widget windows
- **Persistent State**: Desktop widget configurations
- **Runtime State**: Active desktop widgets
- **Used By**: DesktopWidgetApp.tsx, WidgetPicker.tsx

## Legacy Store

### `../store.ts` (Legacy)
- **Status**: ⚠️ Deprecated - being phased out
- **Replacement**: Use the stores above
- **Migration**: In progress
- **Removal**: Planned for v2.0

## Principles Enforced

All stores follow these **mandatory** principles:

### ✅ One Store per Concern
Each store manages a single domain of state. No overlapping responsibilities.

### ✅ No Side Effects in Stores
Stores coordinate state but delegate side effects to:
- **Services** (windowService, widgetRestoration)
- **IPC Abstractions** (IpcService)
- **Hooks** (custom hooks for complex operations)

### ✅ Explicit State Ownership
Every piece of state has a clear owner. No duplication.

### ✅ Actions Named by Intent
Actions represent meaningful transitions, not generic setters:
- ✅ `addWidget()`, `moveWidget()`, `resizeWidget()`
- ❌ `setState()`, `update()`, `set()`

### ✅ Selector-First Consumption
Components subscribe via selectors, not entire store objects:
```typescript
// Good
const widgets = useGridStore((state) => state.widgets);

// Bad
const store = useGridStore();
```

## Architecture Compliance

This structure follows:
- ✅ **zustand-state-architecture** skill
- ✅ **clean-architecture** skill (stores don't call Tauri directly)
- ✅ **separation-of-concerns** skill
- ✅ **state-persistence** skill (explicit persistence boundaries)

## Adding New Stores

If you need a new store:

1. Create in this directory (`stores/`)
2. Name by responsibility (e.g., `notificationStore.ts`)
3. Follow the template from `store.ts`
4. Document responsibility at top of file
5. Ensure no overlap with existing stores
6. Delegate side effects to services
7. Update this README

## Services Directory

Related services that stores delegate to:

- `services/windowService.ts` - Window operations (fullscreen, position)
- `services/widgetRestoration.ts` - Desktop widget restoration
- `services/settingsService.ts` - Settings persistence
- `services/monitorService.ts` - Monitor detection

Stores call services, not IPC directly. This keeps stores testable and pure.
