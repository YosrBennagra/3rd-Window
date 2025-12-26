# Infrastructure Layer

The Infrastructure Layer handles **external integrations** and **I/O operations**. It provides concrete implementations for persistence, IPC communication, system APIs, and other external concerns.

## Purpose

- **Implement** external integrations (Tauri IPC, file system, OS APIs)
- **Provide** concrete adapters for domain contracts
- **Handle** persistence and state storage
- **Manage** system-level operations
- **Isolate** external dependencies from business logic

## Architecture Rule

**Infrastructure Layer can depend on:**
- ✅ Domain Layer (for contracts/interfaces)
- ❌ UI Layer (no UI dependencies)
- ❌ Application Layer (infrastructure is called BY application, not vice versa)

The Infrastructure Layer **implements** the contracts defined in the Domain Layer.

## Directory Structure

```
infrastructure/
├── ipc/              # Tauri IPC communication
├── persistence/      # State persistence & storage
└── system/           # System-level operations
```

---

## IPC Layer (`infrastructure/ipc/`)

Handles all Tauri backend communication.

### IPC Contracts Export
```typescript
import type { 
  SystemMetrics, 
  NetworkStats, 
  Monitor, 
  AppSettings 
} from '@infrastructure/ipc';
```

**Exports:**
- Type contracts from `types/ipc.ts`
- IpcService reference
- Command enums for convenience

### Desktop Widget IPC
```typescript
import { 
  spawnDesktopWidget, 
  closeDesktopWidget,
  updateWidgetPosition,
  updateWidgetSize,
  getDesktopWidgets,
} from '@infrastructure/ipc/desktop-widgets';

// Spawn a new widget window
await spawnDesktopWidget({
  widgetId: 'clock-1',
  widgetType: 'clock',
  monitorId: 'primary',
  position: { x: 100, y: 100 },
  size: { width: 200, height: 150 },
});

// Update widget position
await updateWidgetPosition({
  widgetId: 'clock-1',
  position: { x: 150, y: 150 },
});

// Close widget window
await closeDesktopWidget({ widgetId: 'clock-1' });
```

### Context Menu IPC
```typescript
import { 
  enableContextMenu, 
  disableContextMenu, 
  checkContextMenuInstalled,
} from '@infrastructure/ipc/context-menu';

// Enable Windows context menu integration
await enableContextMenu();

// Check if installed
const installed = await checkContextMenuInstalled();

// Disable context menu
await disableContextMenu();
```

**Platform Support:**
- ✅ Windows: Full registry integration
- ⚠️ macOS/Linux: Not yet implemented

---

## Persistence Layer (`infrastructure/persistence/`)

Handles application state persistence.

### Persistence Service
```typescript
import { 
  loadPersistedState, 
  savePersistedState,
} from '@infrastructure/persistence/persistenceService';

// Load saved state from disk
const state = await loadPersistedState();

// Save current state
await savePersistedState({
  widgets: [...],
  settings: {...},
  monitors: [...],
  schemaVersion: 1,
});
```

**Storage Location:**
- Windows: `%APPDATA%/ThirdScreen/state.json`
- macOS: `~/Library/Application Support/ThirdScreen/state.json`
- Linux: `~/.config/ThirdScreen/state.json`

### Default Settings
```typescript
import { defaultSettings } from '@infrastructure/persistence';

// Get default application settings
const settings = defaultSettings;
```

**Features:**
- Automatic schema versioning
- Migration support (future)
- Error handling with fallbacks
- Type-safe state structure

---

## System Layer (`infrastructure/system/`)

System-level operations and monitoring.

### Alert Evaluation
```typescript
import { evaluateAlerts } from '@infrastructure/system/alerts';
import type { AlertItem, MetricSnapshot } from '@domain/models/widgets';

// Define alert rules
const alerts: AlertItem[] = [
  {
    id: 'cpu-high',
    metric: 'cpu',
    threshold: 80,
    condition: 'above',
  },
];

// Evaluate against current metrics
const triggered = evaluateAlerts(alerts, currentMetrics);
```

### System Metrics
```typescript
import { MetricSnapshot } from '@infrastructure/system/system-metrics';

// Extended metrics for monitoring
interface MetricSnapshot {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkSpeed: number;
}
```

### Other System Services
- **Notifications**: Future notification system integration
- **Shortcuts**: Future keyboard shortcut system
- **Integrations**: External service integrations
- **Pipelines**: CI/CD pipeline monitoring

---

## Error Handling

All infrastructure operations should handle errors gracefully:

```typescript
try {
  const result = await IpcService.someCommand();
  return { success: true, data: result };
} catch (error) {
  console.error('[Infrastructure] Operation failed:', error);
  return { success: false, error: error.message };
}
```

**Error Patterns:**
- Always catch and log errors
- Return Result types when appropriate
- Provide fallback values
- Never throw across IPC boundary

---

## Path Aliases

Import from Infrastructure Layer using path aliases:

```typescript
// ✅ Use path aliases
import { IpcService } from '@application/services';
import type { SystemMetrics } from '@infrastructure/ipc';
import { loadPersistedState } from '@infrastructure/persistence/persistenceService';

// ✅ Or full paths when needed
import { spawnDesktopWidget } from '@infrastructure/ipc/desktop-widgets';
import { evaluateAlerts } from '@infrastructure/system/alerts';

// ❌ Avoid deep relative paths
import { IpcService } from '../../../application/services/ipc';
```

---

## Adding New Infrastructure Code

### New IPC Command
1. Define type contract in `types/ipc.ts`
2. Add command to `IpcService` in `application/services/ipc.ts`
3. Export from `infrastructure/ipc/index.ts` if needed
4. Add Rust implementation in `src-tauri/src/commands/`
5. Document command usage

### New Persistence Feature
1. Update `PersistedState` type in `types/persistence.ts`
2. Add migration logic if schema changes
3. Update `defaultSettings` if needed
4. Add tests for save/load cycle

### New System Integration
1. Create file in `infrastructure/system/`
2. Define domain contracts if needed
3. Implement with error handling
4. Export from `infrastructure/system/index.ts` or main file
5. Add integration tests

---

## Testing

Infrastructure layer requires **integration tests** and mocking:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { IpcService } from '@application/services';

describe('IPC Service', () => {
  it('should fetch system metrics', async () => {
    // Mock Tauri invoke
    vi.mock('@tauri-apps/api/core', () => ({
      invoke: vi.fn().mockResolvedValue({
        cpu: { usage: 45.2 },
        memory: { used: 8192, total: 16384 },
      }),
    }));

    const metrics = await IpcService.getSystemMetrics();
    expect(metrics.cpu.usage).toBe(45.2);
  });
});
```

**Test Categories:**
- **Unit tests**: Pure logic (alert evaluation, data transformation)
- **Integration tests**: IPC communication with mocked backend
- **E2E tests**: Full persistence cycle

---

## Best Practices

### ✅ DO
- Handle all errors gracefully
- Log operations for debugging
- Use type-safe IPC contracts
- Validate external data
- Provide sensible defaults
- Test error paths

### ❌ DON'T
- Throw unhandled errors across IPC
- Mix UI logic in infrastructure
- Access DOM or browser APIs unnecessarily
- Assume external operations succeed
- Block the main thread

---

## Security Considerations

### IPC Commands
- All Tauri commands validated on backend
- Sanitize user inputs before IPC calls
- Never trust external data

### File System
- Use Tauri's sandboxed file system APIs
- Validate file paths
- Handle permission errors

### Registry (Windows)
- Context menu integration requires admin on first install
- Registry keys are user-scoped
- Uninstall cleanup handled automatically

---

## Platform-Specific Notes

### Windows
- Context menu integration via registry
- Native notifications support
- Window management APIs fully supported

### macOS
- Context menu: Not yet implemented
- Notification Center integration planned
- Dock integration planned

### Linux
- Context menu: Not yet implemented
- Desktop notification support planned
- Window management varies by WM

---

## Performance Considerations

### IPC Calls
- Batch operations when possible
- Cache results appropriately
- Use debouncing for frequent updates
- Track performance with `trackIpcCall`

### Persistence
- Write debounced (avoid saving on every change)
- Read on app start only
- Use incremental saves for large states

### System Polling
- Respect polling intervals
- Stop polling when not visible
- Use efficient backend queries

---

## Related Documentation

- [Clean Architecture Overview](../README.md)
- [Application Layer](../application/README.md)
- [Domain Layer](../domain/README.md)
- [IPC Type Contracts](../types/ipc.ts)
- [Persistence Schema](../types/persistence.ts)
- [Tauri Commands](../../src-tauri/src/commands/)

---

## Summary

The Infrastructure Layer provides:
- ✅ Concrete implementations for external integrations
- ✅ Type-safe IPC communication with Tauri backend
- ✅ Persistent state management
- ✅ System-level operations and monitoring
- ✅ Error handling and resilience
- ✅ Platform-specific features

This layer **isolates external dependencies** and provides clean APIs for the Application Layer to consume.
