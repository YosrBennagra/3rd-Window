# Application Layer

The Application Layer coordinates between the UI, Domain, and Infrastructure layers. It contains **application-specific logic**, state management, and service orchestration.

## Purpose

- **Coordinate** business logic from the Domain layer
- **Manage** application state (Zustand stores)
- **Orchestrate** services and data flow
- **Provide** React hooks for UI consumption
- **Abstract** infrastructure details from UI

## Architecture Rule

**Application Layer can depend on:**
- ✅ Domain Layer (business logic)
- ✅ Infrastructure Layer (for implementation)
- ❌ UI Layer (no dependencies on React components)

## Directory Structure

```
application/
├── hooks/              # React hooks for UI consumption
├── services/           # Application services & orchestration
├── stores/             # Zustand state stores
└── selectors.ts        # Reusable store selectors
```

---

## Hooks (`application/hooks/`)

React hooks that provide UI-friendly access to application features.

### Available Hooks

#### Time & Clock
```typescript
import { useClock, useFormattedTime } from '@application/hooks';

// Get current time with auto-refresh
const { time, date } = useClock();

// Format time with specific options
const formattedTime = useFormattedTime({
  format24Hour: true,
  showSeconds: false,
});
```

#### System Metrics
```typescript
import { useSystemMetrics, useNetworkStats, useSystemTemperatures } from '@application/hooks';

// CPU, RAM, disk metrics with visibility optimization
const metrics = useSystemMetrics({
  pollingInterval: 1000,
  enableVisibilityDetection: true,
});

// Network statistics with performance tracking
const networkStats = useNetworkStats();

// Temperature monitoring with slower polling
const temperatures = useSystemTemperatures();
```

#### UI Interactions
```typescript
import { useContextMenu } from '@application/hooks';

// Context menu handler with positioning
const { showContextMenu, hideContextMenu, contextMenuState } = useContextMenu();

showContextMenu({ x: 100, y: 200, items: [...] });
```

### Hook Design Principles

- **Performance-optimized**: Visibility detection, caching, debouncing
- **Type-safe**: Full TypeScript support with strict types
- **Error handling**: Graceful degradation with error states
- **Testing-friendly**: Easy to mock and test

---

## Services (`application/services/`)

Services orchestrate domain logic and infrastructure concerns.

### Core Services

#### IpcService
Central service for all Tauri backend communication.

```typescript
import { IpcService } from '@application/services';

// Get system metrics from backend
const metrics = await IpcService.getSystemMetrics();

// Save application settings
await IpcService.saveSettings(settings);

// Open file dialog
const filePath = await IpcService.openFileDialog();
```

**Key Features:**
- Type-safe command invocations
- Automatic error handling
- Performance tracking (optional)
- Centralized backend communication

#### Settings Service
```typescript
import { loadSettings, saveSettings } from '@application/services';

// Load persisted settings
const settings = await loadSettings();

// Save with validation
await saveSettings(updatedSettings);
```

#### Monitor Service
```typescript
import { getMonitors, setFullscreenWithPersistence } from '@application/services';

// Get all connected monitors
const monitors = await getMonitors();

// Set fullscreen on specific monitor
await setFullscreenWithPersistence(monitorId, true);
```

#### Widget Plugin Adapter
```typescript
import { 
  createWidgetPluginFromSimpleDescriptor,
  createSettingsValidator,
  adaptLegacyWidget,
} from '@application/services';

// Create plugin from simple descriptor
const plugin = createWidgetPluginFromSimpleDescriptor({
  id: 'my-widget',
  name: 'My Widget',
  component: MyWidgetComponent,
  constraints: WIDGET_CONSTRAINTS,
});

// Create type-safe settings validator
const validator = createSettingsValidator(ensureMyWidgetSettings);
```

#### Widget Restoration
```typescript
import { restoreDesktopWidgets } from '@application/services';

// Restore widgets on app startup
await restoreDesktopWidgets(persistedState);
```

#### Window Service
```typescript
import { createDesktopWidgetWindow, createSettingsWindow } from '@application/services';

// Create new desktop widget window
await createDesktopWidgetWindow(widgetId, monitorId);

// Open settings window
await createSettingsWindow();
```

---

## Stores (`application/stores/`)

Zustand stores for application state management.

### Available Stores

#### AppStore
Main application state.

```typescript
import { useAppStore } from '@application/stores';

const {
  settings,
  updateSettings,
  monitors,
  activeMonitor,
  setActiveMonitor,
} = useAppStore();
```

**State:**
- Application settings
- Connected monitors
- Active monitor
- Global app status

#### GridStore
Desktop widget grid state.

```typescript
import { useGridStore } from '@application/stores';

const {
  widgets,
  addWidget,
  removeWidget,
  updateWidgetPosition,
  updateWidgetSize,
} = useGridStore();
```

**State:**
- Widget instances
- Widget positions & sizes
- Grid layout
- Widget z-indices

#### DesktopWidgetStore
Individual desktop widget window state.

```typescript
import { useDesktopWidgetStore } from '@application/stores';

const {
  widgetInstance,
  updateLocalSettings,
  isLocked,
  toggleLock,
} = useDesktopWidgetStore();
```

**State:**
- Current widget instance
- Local widget settings
- Lock state
- Window-specific state

---

## Selectors (`application/selectors.ts`)

Reusable selectors for efficient state access.

```typescript
import { createShallowSelector } from '@application/selectors';

// Create optimized selector with shallow comparison
const selectActiveWidgets = createShallowSelector(
  (state) => state.widgets.filter(w => w.enabled)
);

const activeWidgets = useAppStore(selectActiveWidgets);
```

**Benefits:**
- Prevent unnecessary re-renders
- Memoization for derived state
- Type-safe selection
- Performance optimization

---

## Path Aliases

Import from Application Layer using path aliases:

```typescript
// ✅ Use path aliases
import { IpcService } from '@application/services';
import { useSystemMetrics } from '@application/hooks';
import { useAppStore } from '@application/stores';

// ❌ Avoid relative paths
import { IpcService } from '../../../application/services/ipc';
```

---

## Adding New Code

### New Hook
1. Create file in `application/hooks/`
2. Implement hook with TypeScript types
3. Add to `application/hooks/index.ts`
4. Add JSDoc documentation
5. Write unit tests

### New Service
1. Create file in `application/services/`
2. Implement service (functions or object)
3. Export from `application/services/index.ts`
4. Add JSDoc with examples
5. Add integration tests

### New Store
1. Create file in `application/stores/`
2. Define store with Zustand
3. Export from `application/stores/index.ts`
4. Document state shape and actions
5. Add state tests

---

## Testing

Application layer should have:
- **Unit tests** for hooks and services
- **Integration tests** for store interactions
- **Mock dependencies** from Infrastructure layer

```typescript
// Example: Testing a hook
import { renderHook } from '@testing-library/react';
import { useSystemMetrics } from '@application/hooks';

test('useSystemMetrics returns metrics', async () => {
  const { result } = renderHook(() => useSystemMetrics());
  
  await waitFor(() => {
    expect(result.current.metrics).toBeDefined();
  });
});
```

---

## Related Documentation

- [Clean Architecture Overview](../README.md)
- [Domain Layer](../domain/README.md)
- [UI Layer](../ui/README.md)
- [Widget Plugin System](../../docs/architecture/plugin-system.md)
