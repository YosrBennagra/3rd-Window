# Domain Layer

The Domain Layer contains the **core business logic** and rules of the ThirdScreen application. It is the heart of the application and is **completely independent** of frameworks, UI, or infrastructure concerns.

## Purpose

- Define **business entities** and their rules
- Implement **business logic** and calculations
- Specify **domain contracts** and interfaces
- Provide **domain services** for complex operations
- Define **validation** and **constraints**

## Architecture Rule

**Domain Layer MUST be independent:**
- ✅ Can use standard libraries (e.g., date-fns)
- ❌ NEVER import from UI Layer (React, components)
- ❌ NEVER import from Application Layer (hooks, stores)
- ❌ NEVER import from Infrastructure Layer (IPC, persistence)

The Domain Layer is **pure business logic** — no side effects, no external dependencies.

## Directory Structure

```
domain/
├── adapters/           # Adapters for external contracts
├── calculators/        # Pure calculation functions
├── config/            # Domain configuration & constraints
├── contracts/         # Interfaces & type definitions
├── formatters/        # Data formatting utilities
├── init/              # Initialization logic
├── models/            # Business entities & types
├── registries/        # Domain registries (e.g., widget registry)
└── services/          # Domain services (orchestration)
```

---

## Models (`domain/models/`)

Core business entities and their types.

### Widget Models
```typescript
import type { 
  WidgetInstance, 
  WidgetSettings,
  ClockWidgetSettings,
  TimerWidgetSettings,
} from '@domain/models';

// Widget instance with full metadata
const widget: WidgetInstance = {
  id: createWidgetInstanceId(),
  type: 'clock',
  position: { x: 100, y: 100 },
  size: { width: 200, height: 150 },
  settings: { format24Hour: true },
  monitorId: createMonitorId('primary'),
};
```

### Settings Validation
Each widget has an `ensure` function for type-safe settings:

```typescript
import { 
  ensureClockWidgetSettings,
  ensureTimerWidgetSettings,
  ensureImageWidgetSettings,
} from '@domain/models';

// Validate and sanitize settings
const settings = ensureClockWidgetSettings(userInput);
// Returns: ClockWidgetSettings (type-safe)
```

**All Widget Settings:**
- `ensureClockWidgetSettings` - Clock widget
- `ensureTimerWidgetSettings` - Timer widget
- `ensureImageWidgetSettings` - Image widget
- `ensureVideoWidgetSettings` - Video widget
- `ensureNotesWidgetSettings` - Notes widget
- `ensureQuickLinksWidgetSettings` - Quick Links widget
- `ensureNetworkMonitorWidgetSettings` - Network Monitor widget
- `ensurePDFWidgetSettings` - PDF widget

---

## Contracts (`domain/contracts/`)

Interfaces and type definitions for domain contracts.

### Plugin Contract
```typescript
import type { 
  WidgetPlugin,
  WidgetPluginMetadata,
  WidgetPluginSettingsValidator,
} from '@domain/contracts';

// Define a widget plugin
const plugin: WidgetPlugin = {
  metadata: { /* ... */ },
  component: MyComponent,
  constraints: { /* ... */ },
  settingsValidator: { /* ... */ },
};
```

### IPC Contract
```typescript
import type { 
  SystemMetrics,
  NetworkStats,
  MonitorInfo,
} from '@domain/contracts';

// Backend response types
const metrics: SystemMetrics = {
  cpu: { usage: 45.2, cores: 8 },
  memory: { used: 8192, total: 16384 },
  // ...
};
```

---

## Config (`domain/config/`)

Domain-level configuration and constraints.

### Widget Constraints
```typescript
import {
  CLOCK_CONSTRAINTS,
  TIMER_CONSTRAINTS,
  IMAGE_CONSTRAINTS,
} from '@domain/config';

// Each constraint defines min/max size and aspect ratio
const constraints = CLOCK_CONSTRAINTS;
// { minWidth: 120, minHeight: 80, maxWidth: 400, maxHeight: 300 }
```

**Available Constraints:**
- `CLOCK_CONSTRAINTS`
- `TIMER_CONSTRAINTS`
- `ACTIVITY_CONSTRAINTS`
- `IMAGE_CONSTRAINTS`
- `VIDEO_CONSTRAINTS`
- `NOTES_CONSTRAINTS`
- `QUICKLINKS_CONSTRAINTS`
- `NETWORK_MONITOR_CONSTRAINTS`
- `TEMPERATURE_CONSTRAINTS`
- `RAM_CONSTRAINTS`
- `DISK_CONSTRAINTS`
- `PDF_CONSTRAINTS`

---

## Formatters (`domain/formatters/`)

Pure formatting functions for domain data.

```typescript
import {
  formatBytes,
  formatPercent,
  formatNetworkSpeed,
  formatTemperature,
} from '@domain/formatters';

// Format bytes to human-readable
formatBytes(1024 * 1024); // "1.00 MB"

// Format percentage with precision
formatPercent(0.4567, 1); // "45.7%"

// Format network speed
formatNetworkSpeed(1500000); // "1.50 MB/s"

// Format temperature
formatTemperature(75.5); // "75.5°C"
```

**Principles:**
- Pure functions (no side effects)
- Consistent output formats
- Localization-ready
- Type-safe inputs/outputs

---

## Calculators (`domain/calculators/`)

Pure calculation functions.

```typescript
import { calculateGridPosition, calculateAspectRatio } from '@domain/calculators';

// Calculate widget position on grid
const position = calculateGridPosition({ x: 150, y: 200 }, gridSize);

// Calculate aspect ratio-constrained size
const size = calculateAspectRatio(newWidth, constraints);
```

**Characteristics:**
- Deterministic (same input → same output)
- No side effects
- Easily testable
- Performance-optimized

---

## Registries (`domain/registries/`)

Domain-level registries for managing collections.

### Widget Plugin Registry
```typescript
import { widgetPluginRegistry } from '@domain/registries';

// Register a plugin
widgetPluginRegistry.register(plugin);

// Check if plugin exists
const hasPlugin = widgetPluginRegistry.has('clock');

// Get plugin metadata
const metadata = widgetPluginRegistry.get('clock');

// Get all enabled plugins
const enabledIds = widgetPluginRegistry.getEnabledIds();
```

**Features:**
- Type-safe registration
- Metadata validation
- Enable/disable plugins
- Query capabilities

---

## Services (`domain/services/`)

Domain services for complex business logic orchestration.

### Widget Plugin Service
```typescript
import { createWidgetPluginFromSimpleDescriptor } from '@domain/services';

// Create plugin from descriptor
const plugin = createWidgetPluginFromSimpleDescriptor({
  id: 'my-widget',
  name: 'My Widget',
  description: 'A custom widget',
  component: MyComponent,
  constraints: MY_CONSTRAINTS,
  defaultSettings: MY_DEFAULT_SETTINGS,
  tags: ['custom', 'utility'],
});
```

**Service Principles:**
- Orchestrate multiple domain operations
- Maintain domain rules
- No external dependencies
- Pure or clearly defined side effects

---

## Adapters (`domain/adapters/`)

Adapters for external contracts (ports pattern).

```typescript
import { adaptWidgetSettings } from '@domain/adapters';

// Adapt external data to domain model
const domainSettings = adaptWidgetSettings(externalData);
```

**Purpose:**
- Convert external data to domain models
- Maintain domain integrity
- Isolate external changes

---

## Validation Rules

### Widget Validation
- Widget IDs must be unique
- Widget positions must be within monitor bounds
- Widget sizes must respect constraints
- Settings must match widget schema

### Settings Validation
Each widget type has specific validation rules enforced by `ensure` functions:

```typescript
// Clock settings validation
ensureClockWidgetSettings({
  format24Hour: true,    // boolean
  showSeconds: false,    // boolean
  showDate: true,        // boolean
});

// Timer settings validation
ensureTimerWidgetSettings({
  duration: 300,         // seconds (positive number)
  autoStart: false,      // boolean
});
```

---

## Path Aliases

Import from Domain Layer using path aliases:

```typescript
// ✅ Use path aliases
import { WidgetInstance } from '@domain/models';
import { formatBytes } from '@domain/formatters';
import { CLOCK_CONSTRAINTS } from '@domain/config';

// ❌ Avoid relative paths
import { WidgetInstance } from '../../../domain/models/widget';
```

---

## Adding New Domain Code

### New Model
1. Create type/interface in `domain/models/`
2. Add validation functions if needed
3. Export from `domain/models/index.ts`
4. Document in JSDoc

### New Formatter
1. Create pure function in `domain/formatters/`
2. Add unit tests (100% coverage recommended)
3. Export from `domain/formatters/index.ts`
4. Document edge cases

### New Validator
1. Add to appropriate model file
2. Follow naming: `ensureXxxSettings`
3. Throw descriptive errors
4. Return typed output
5. Test all validation paths

### New Constraint
1. Add to `domain/config/widgetConstraints.ts`
2. Follow naming: `XXX_CONSTRAINTS`
3. Include min/max width/height
4. Document aspect ratio if applicable

---

## Testing

Domain layer should have **highest test coverage** (aim for 95%+):

```typescript
// Example: Testing a formatter
import { formatBytes } from '@domain/formatters';

describe('formatBytes', () => {
  it('formats bytes to KB', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
  });

  it('formats bytes to MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
  });

  it('handles zero', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });
});
```

**Test Principles:**
- Pure functions are easy to test
- Test edge cases thoroughly
- No mocking needed (pure domain logic)
- Fast test execution

---

## Best Practices

### ✅ DO
- Keep functions pure when possible
- Use TypeScript strict mode
- Validate all inputs
- Document domain rules
- Write comprehensive tests

### ❌ DON'T
- Import from UI/Application/Infrastructure
- Use React hooks or components
- Make HTTP requests or IPC calls
- Access browser APIs
- Perform I/O operations

---

## Related Documentation

- [Clean Architecture Overview](../README.md)
- [Application Layer](../application/README.md)
- [Widget Plugin System](../../docs/architecture/plugin-system.md)
- [Widget Contracts](../../docs/DESKTOP_WIDGETS.md)
