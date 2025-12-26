# Source Code Architecture

This document describes the organization and architecture of the ThirdScreen source code.

## Overview

ThirdScreen follows **Clean Architecture** principles with clear separation of concerns across layers. Each layer has well-defined responsibilities and dependencies flow inward (UI → Application → Domain).

## Directory Structure

```
src/
├── application/     # Application layer (coordination & orchestration)
├── config/          # Application configuration
├── domain/          # Domain layer (business logic & contracts)
├── infrastructure/  # Infrastructure layer (external integrations)
├── test/            # Test utilities and mocks
├── theme/           # Global styles and CSS
├── types/           # TypeScript type definitions
├── ui/              # UI layer (React components)
├── utils/           # Utility functions
└── index.ts         # Top-level barrel export
```

## Layer Details

### UI Layer (`ui/`)

**Purpose**: React components and user interface

**Responsibilities**:
- Render UI components
- Handle user interactions
- Consume application services and stores
- Display data from domain models

**Key Exports**:
- `App` - Main application component
- `DesktopWidgetApp` - Desktop widget host
- `SettingsWindow` - Settings interface
- `WidgetPickerWindow` - Widget selection UI
- Component folders: `components/`, `widgets/`

**Import Pattern**:
```typescript
import { WidgetFrame, DesktopWidget } from './ui';
import { ClockWidget } from './ui/components/widgets/desktop';
```

---

### Application Layer (`application/`)

**Purpose**: Coordination between UI and domain, state management

**Responsibilities**:
- Coordinate domain logic with infrastructure
- Manage application-wide state (Zustand stores)
- Provide React hooks for components
- Orchestrate service calls

**Structure**:
```
application/
├── hooks/           # React hooks (useSystemMetrics, useClock, etc.)
├── services/        # Service orchestration (IPC, settings, widgets)
├── stores/          # Zustand stores (app, grid, desktop widgets)
├── selectors.ts     # Store selectors
└── index.ts         # Barrel export
```

**Key Exports**:
- **Hooks**: `useSystemMetrics`, `useNetworkStats`, `useClock`, `useContextMenu`
- **Services**: `IpcService`, `loadSettings`, `saveSettings`, `spawnDesktopWidget`
- **Stores**: `useAppStore`, `useGridStore`, `useDesktopWidgetStore`

**Import Pattern**:
```typescript
import { useSystemMetrics, useAppStore, IpcService } from './application';
```

---

### Domain Layer (`domain/`)

**Purpose**: Core business logic, contracts, and models

**Responsibilities**:
- Define business entities and value objects
- Specify contracts and interfaces
- Implement pure business logic
- No framework or infrastructure dependencies

**Structure**:
```
domain/
├── adapters/        # Ports and adapters
├── calculators/     # Business calculations
├── config/          # Domain configuration
├── contracts/       # Interfaces and contracts
├── formatters/      # Data formatters
├── init/            # Initialization logic
├── models/          # Domain models
├── registries/      # Entity registries
├── services/        # Domain services
└── index.ts         # Barrel export
```

**Key Exports**:
- Widget contracts and metadata
- Layout models (`WidgetLayout`, `GridLayout`)
- Business rules and validators
- Domain services

**Import Pattern**:
```typescript
import { WidgetMetadata, WidgetLayout, GridLayout } from './domain';
```

---

### Infrastructure Layer (`infrastructure/`)

**Purpose**: External integrations and I/O

**Responsibilities**:
- IPC communication with Tauri backend
- State persistence (file system)
- System-level integrations (startup, shortcuts, notifications)

**Structure**:
```
infrastructure/
├── ipc/             # IPC contracts and wrappers
├── persistence/     # State storage
└── system/          # OS integrations
```

**Key Exports**:
- **IPC**: All Tauri command wrappers, type contracts
- **Persistence**: `saveState`, `loadState`, `Storage`
- **System**: Startup registration, notifications, shortcuts

**Import Pattern**:
```typescript
import { IpcService, saveState, loadState } from './infrastructure/ipc';
import { showNotification } from './infrastructure/system';
```

---

### Configuration (`config/`)

**Purpose**: Application-wide configuration

**Contents**:
- `widgetRegistry.ts` - Widget plugin registry
- `widgetPluginBootstrap.ts` - Plugin initialization
- `widgets.ts` - Available widget definitions

**Import Pattern**:
```typescript
import { widgetRegistry, AVAILABLE_WIDGETS } from './config';
```

---

### Types (`types/`)

**Purpose**: Shared TypeScript type definitions

**Contents**:
- `branded.ts` - Type-safe branded types (IDs)
- `ipc.ts` - IPC type contracts
- `persistence.ts` - Persistence types and schema

**Import Pattern**:
```typescript
import type { WidgetId, SystemMetrics, PersistedState } from './types';
```

---

### Utilities (`utils/`)

**Purpose**: Pure utility functions

**Contents**:
- `performance.ts` - Performance tracking decorators
- `performanceMonitoring.ts` - Metrics collection
- `system.ts` - Formatting helpers (bytes, uptime, etc.)

**Import Pattern**:
```typescript
import { formatBytes, trackIpcCall, withPerformanceTracking } from './utils';
```

---

### Theme (`theme/`)

**Purpose**: Global CSS and styling

**Contents**:
- `base.css` - Base styles and CSS reset
- `global.css` - Global application styles
- `theme.css` - Theme variables (colors, spacing)
- `components/` - Component-specific styles

**Import Pattern**:
```typescript
import './theme/global.css';
import styles from './theme/components/Widget.module.css';
```

---

### Test (`test/`)

**Purpose**: Test utilities and fixtures

**Contents**:
- `setup.ts` - Vitest setup
- `mocks/` - Mock implementations
- `utils/` - Test helpers

---

## Architecture Principles

### 1. Dependency Rule

Dependencies always point inward:

```
UI → Application → Domain ← Infrastructure
```

- **Domain** has no dependencies
- **Application** depends on Domain
- **Infrastructure** depends on Domain (implements interfaces)
- **UI** depends on Application and Domain

### 2. Barrel Exports

Every major folder has an `index.ts` that re-exports its public API:

```typescript
// Import from barrel export
import { useSystemMetrics, IpcService } from './application';

// Not directly from files
import { useSystemMetrics } from './application/hooks/useSystemMetrics';
```

### 3. Named Exports Only

**All exports are named** (no default exports):

```typescript
// ✅ Good
export function useSystemMetrics() { }
import { useSystemMetrics } from './hooks';

// ❌ Avoid
export default function useSystemMetrics() { }
import useSystemMetrics from './hooks';
```

### 4. Type Safety

- Use branded types for IDs (`WidgetId`, `MonitorId`)
- Explicit type contracts for IPC boundaries
- Strict TypeScript mode enabled

### 5. Clean Architecture Layers

```
┌─────────────────────────────────────┐
│   UI Layer (React Components)       │ ← User Interface
├─────────────────────────────────────┤
│   Application Layer                 │ ← Coordination & State
│   (Services, Stores, Hooks)         │
├─────────────────────────────────────┤
│   Domain Layer                      │ ← Business Logic
│   (Models, Contracts, Rules)        │   (Framework-Free)
├─────────────────────────────────────┤
│   Infrastructure Layer              │ ← External I/O
│   (IPC, Persistence, System)        │
└─────────────────────────────────────┘
```

---

## Best Practices

### Importing

```typescript
// ✅ Import from barrel exports
import { useAppStore, IpcService } from './application';
import { WidgetMetadata } from './domain';
import { formatBytes } from './utils';

// ❌ Don't import from deep paths
import { useAppStore } from './application/stores/store';
```

### Adding New Code

1. **Determine the correct layer**:
   - UI component? → `ui/components/`
   - Business logic? → `domain/`
   - Coordination? → `application/services/`
   - External I/O? → `infrastructure/`

2. **Use named exports**:
   ```typescript
   export function myFunction() { }
   export const MyComponent = () => { };
   ```

3. **Update barrel exports**:
   Add to relevant `index.ts` file

4. **Follow dependency rules**:
   Domain layer should never import from Application or UI

### File Organization

- **One primary export per file** (component, service, etc.)
- **Colocate related files** (component + styles + tests)
- **Use descriptive names** (`useSystemMetrics`, not `hook`)

---

## Usage Examples

### Using Path Aliases

Path aliases make imports cleaner and more maintainable:

```typescript
// ✅ Clean imports with path aliases
import { IpcService, loadSettings, saveSettings } from '@application/services';
import { useSystemMetrics, useClock } from '@application/hooks';
import { useAppStore, useGridStore } from '@application/stores';
import { WidgetInstance, WidgetSettings } from '@domain/models';
import { formatBytes, formatPercent } from '@utils';
import { CLOCK_CONSTRAINTS } from '@domain/config';

// ❌ Avoid deep relative paths
import { IpcService } from '../../../application/services/ipc';
import { useSystemMetrics } from '../../../../application/hooks/useSystemMetrics';
```

**Available Aliases:**
- `@application/*` → `./src/application/*`
- `@domain/*` → `./src/domain/*`
- `@infrastructure/*` → `./src/infrastructure/*`
- `@ui/*` → `./src/ui/*`
- `@config/*` → `./src/config/*`
- `@types/*` → `./src/types/*`
- `@utils/*` → `./src/utils/*`
- `@theme/*` → `./src/theme/*`

### Creating a Widget Plugin

Register a new widget with the plugin system:

```typescript
import { widgetPluginRegistry } from '@domain/registries';
import { 
  createWidgetPluginFromSimpleDescriptor,
  createSettingsValidator,
} from '@application/services';
import { MyWidget } from '@ui/components/widgets';
import { 
  MY_WIDGET_CONSTRAINTS,
  MY_WIDGET_DEFAULT_SETTINGS,
  ensureMyWidgetSettings,
} from '@domain/models';

// Register widget plugin
widgetPluginRegistry.register(
  createWidgetPluginFromSimpleDescriptor({
    id: 'my-widget',
    name: 'My Widget',
    description: 'A custom widget for specific functionality',
    component: MyWidget,
    constraints: MY_WIDGET_CONSTRAINTS,
    defaultSettings: MY_WIDGET_DEFAULT_SETTINGS,
    settingsValidator: createSettingsValidator(ensureMyWidgetSettings),
    tags: ['custom', 'utility'],
    icon: `<svg viewBox="0 0 48 48">...</svg>`,
  })
);
```

### Using Application Services

```typescript
import { IpcService } from '@application/services';

// Fetch system metrics
async function displaySystemInfo() {
  try {
    const metrics = await IpcService.getSystemMetrics();
    console.log(`CPU: ${metrics.cpu.usage}%`);
    console.log(`RAM: ${formatBytes(metrics.memory.used)}`);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
  }
}

// Save application settings
async function updateSettings(newSettings) {
  await IpcService.saveSettings(newSettings);
  console.log('Settings saved successfully');
}
```

### Creating Custom Hooks

```typescript
import { useEffect, useState } from 'react';
import { useSystemMetrics } from '@application/hooks';
import { formatBytes } from '@utils';

// Custom hook combining application hooks
export function useFormattedSystemInfo() {
  const metrics = useSystemMetrics({ pollingInterval: 2000 });
  
  return {
    cpu: metrics.metrics?.cpu.usage.toFixed(1) + '%',
    ram: formatBytes(metrics.metrics?.memory.used ?? 0),
    isLoading: metrics.isLoading,
    error: metrics.error,
  };
}
```

### Working with Zustand Stores

```typescript
import { useAppStore, useGridStore } from '@application/stores';
import { createWidgetInstanceId } from '@types';

function MyComponent() {
  // Access store state and actions
  const { settings, updateSettings } = useAppStore();
  const { widgets, addWidget } = useGridStore();
  
  const handleAddWidget = () => {
    addWidget({
      id: createWidgetInstanceId(),
      type: 'clock',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      settings: {},
      monitorId: settings.primaryMonitor,
    });
  };
  
  return <button onClick={handleAddWidget}>Add Widget</button>;
}
```

### Settings Validation

```typescript
import { 
  ensureClockWidgetSettings,
  ensureTimerWidgetSettings,
} from '@domain/models';

// Validate user input
function validateAndSaveSettings(userInput: unknown) {
  try {
    // Type-safe validation with runtime checks
    const settings = ensureClockWidgetSettings(userInput);
    
    // settings is now ClockWidgetSettings type
    console.log(`24-hour format: ${settings.format24Hour}`);
    
    return { valid: true, settings };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

---

## Related Documentation

- [Widget System](../docs/DESKTOP_WIDGETS.md)
- [Plugin Architecture](../docs/architecture/plugin-system.md)
- [State Persistence](../docs/architecture/state-persistence.md)
- [Testing Guide](../docs/dev/testing.md)

---

## Summary

ThirdScreen's source code is organized into clear architectural layers with:
- ✅ Clean separation of concerns
- ✅ Barrel exports for clean imports
- ✅ Named exports only (no defaults)
- ✅ Dependency rules enforced
- ✅ Type-safe boundaries
- ✅ Comprehensive documentation

This structure ensures maintainability, testability, and scalability as the application grows.
