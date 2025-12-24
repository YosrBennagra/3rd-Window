# Testing Strategy & Guide

## Overview

ThirdScreen follows **testability-by-design** principles:

1. **Test Logic, Not Wiring** - Focus on domain logic, not framework integration
2. **Isolation by Design** - Domain code is testable without React/Zustand/Tauri
3. **Determinism** - Tests are repeatable and predictable
4. **Right Level Testing** - Unit > Integration > E2E

## Architecture for Testability

```
┌────────────────────────────────────────────┐
│ UI Layer (React Components)                 │
│ - Minimal logic, mostly presentation       │
│ - Tested via integration tests (optional)  │
└────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Application Layer (Zustand Stores)          │
│ - State management, coordination           │
│ - Tested via integration tests             │
└────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Domain Layer (Pure Logic) ★★★               │
│ - Pure functions, validators, calculators  │
│ - HEAVILY unit tested (PRIMARY FOCUS)      │
└────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Infrastructure Layer (IPC, System)          │
│ - Mocked in tests                          │
│ - Rust tests for backend logic             │
└────────────────────────────────────────────┘
```

## Test Organization

```
src/
├── domain/                  # Pure domain logic (80% coverage target)
│   ├── formatters/
│   │   ├── system.ts
│   │   └── system.test.ts   ★ Unit tests
│   ├── calculators/
│   │   ├── grid.ts
│   │   └── grid.test.ts     ★ Unit tests
│   ├── services/
│   │   ├── alerts.ts
│   │   └── alerts.test.ts   ★ Unit tests
│   └── models/
│       ├── widgets.ts
│       └── widgets.test.ts  ★ Unit tests
│
├── application/             # State management
│   └── stores/
│       ├── gridStore.ts
│       └── gridStore.integration.test.ts  ★ Integration tests
│
└── test/                    # Test infrastructure
    ├── setup.ts             # Global test setup
    ├── mocks/
    │   ├── tauri.ts         # IPC mocks
    │   └── zustand.ts       # Store mocks
    └── utils/
        └── test-helpers.ts  # Test utilities
```

## Running Tests

### Quick Commands

```bash
npm test                  # Run tests in watch mode
npm run test:ui           # Open Vitest UI (visual test runner)
npm run test:run          # Run once (CI mode)
npm run test:coverage     # Generate coverage report
```

### Development Workflow

1. **TDD Flow**: Write test → See it fail → Implement → See it pass
2. **Watch Mode**: `npm test` watches files and re-runs affected tests
3. **Visual UI**: `npm run test:ui` provides interactive test browser
4. **Coverage**: Aim for **>80% coverage** in domain layer

## Writing Tests

### Unit Tests (Domain Layer)

**Pure functions are easy to test:**

```typescript
// domain/formatters/system.ts
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes === 0) return '0.0 B';
  // ... pure logic
}

// domain/formatters/system.test.ts
import { describe, it, expect } from 'vitest';
import { formatBytes } from './system';

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0.0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });

  it('handles edge cases', () => {
    expect(formatBytes(Infinity)).toBe('0.0 B');
    expect(formatBytes(NaN)).toBe('0.0 B');
  });
});
```

**Key principles:**
- ✅ **Pure functions**: No side effects, deterministic
- ✅ **Test behavior**: Not implementation details
- ✅ **Edge cases**: Test boundary conditions
- ✅ **Readable**: Tests are documentation

### Integration Tests (Application Layer)

**Test state workflows:**

```typescript
import { createTestStore } from '@/test/mocks/zustand';

describe('Grid Store Workflow', () => {
  let store: ReturnType<typeof createTestStore<GridState>>;

  beforeEach(() => {
    store = createTestStore<GridState>(storeCreator);
  });

  it('adds and removes widgets', () => {
    const widget = createMockWidget();
    store.getState().addWidget(widget);
    expect(store.getState().widgets).toHaveLength(1);
    
    store.getState().removeWidget(widget.id);
    expect(store.getState().widgets).toHaveLength(0);
  });
});
```

**Mock IPC calls:**

```typescript
import { mockCommand, mockMonitors } from '@/test/mocks/tauri';

describe('Monitor Integration', () => {
  it('loads monitors from Tauri', async () => {
    mockCommand('get_monitors', mockMonitors);
    
    const monitors = await invoke('get_monitors');
    expect(monitors).toEqual(mockMonitors);
  });
});
```

## Test Utilities

### Mock Helpers

```typescript
// Mock Tauri commands
import { mockCommand, mockCommands } from '@/test/mocks/tauri';

mockCommand('get_monitors', [{ id: 'DISPLAY1', ... }]);
mockCommands({
  'get_monitors': [{ ... }],
  'get_system_metrics': { cpuUsage: 50, ... },
});

// Create mock data
import { createMockMetrics, createMockWidget } from '@/test/utils/test-helpers';

const metrics = createMockMetrics({ cpuUsage: 85 });
const widget = createMockWidget({ type: 'clock', x: 0, y: 0 });

// Time control (for deterministic tests)
import { mockTime, resetTime } from '@/test/utils/test-helpers';

mockTime(1704067200000); // Fixed timestamp
// ... test code
resetTime();
```

## Rust Tests

**Backend tests are already comprehensive:**

```bash
cd src-tauri
cargo test                     # Run all Rust tests
cargo test validation          # Run specific module
cargo test -- --nocapture      # Show output
```

**Existing test coverage:**
- ✅ `validation.rs` - Input validation (16+ tests)
- ✅ `window_placement.rs` - Monitor positioning (8+ tests)
- ✅ `registry_utils.rs` - Windows registry (10+ tests)
- ✅ `protocol.rs` - Deep link protocol (12+ tests)
- ✅ `storage.rs` - Persistence layer (8+ tests)
- ✅ `schemas.rs` - Data migrations (6+ tests)

## Best Practices

### Do's ✅

- **Test domain logic extensively** (pure functions, validators, calculators)
- **Mock external dependencies** (IPC, time, random numbers)
- **Use descriptive test names** ("adds widget to empty grid" not "test1")
- **Test edge cases** (null, undefined, invalid inputs, boundary values)
- **Keep tests focused** (one behavior per test)
- **Use test helpers** (createMockWidget, mockCommand, etc.)

### Don'ts ❌

- **Don't test React internals** (hooks, render cycles)
- **Don't test Tauri APIs** (mock them instead)
- **Don't use real time/dates** (mock Date.now())
- **Don't test implementation** (test behavior, not code structure)
- **Don't write brittle tests** (avoid snapshots of complex objects)

## Coverage Goals

| Layer              | Target Coverage | Priority |
| ------------------ | --------------- | -------- |
| Domain Logic       | >80%            | ★★★★★    |
| Application Layer  | >60%            | ★★★☆☆    |
| UI Components      | Optional        | ★☆☆☆☆    |
| Rust Backend       | >70%            | ★★★★☆    |

**Focus on domain layer first** - it's pure, stable, and most valuable to test.

## CI/CD Integration

Tests run automatically in CI pipeline:

```yaml
# .github/workflows/build.yml
- name: Run TypeScript Tests
  run: npm run test:run

- name: Run Rust Tests
  run: cd src-tauri && cargo test
```

**Pre-commit hooks** (optional):
```bash
# Run tests before commit
git commit  # Tests run automatically if configured
```

## Debugging Tests

### VSCode Integration

1. Install **Vitest Runner** extension
2. Click "Run" above each test
3. Set breakpoints in test files
4. Debug with F5

### Terminal Debugging

```bash
# Run single test file
npm test src/domain/formatters/system.test.ts

# Run tests matching pattern
npm test -- -t "formatBytes"

# Show full output
npm test -- --reporter=verbose

# Debug with Node inspector
npm test -- --inspect-brk
```

## Common Patterns

### Testing Async Code

```typescript
it('loads monitors asynchronously', async () => {
  mockCommand('get_monitors', mockMonitors);
  
  const result = await invoke('get_monitors');
  expect(result).toEqual(mockMonitors);
});
```

### Testing Error Handling

```typescript
it('handles invalid input gracefully', () => {
  expect(() => validateWidget(null)).toThrow('Widget cannot be null');
  expect(formatBytes(NaN)).toBe('0.0 B'); // Graceful fallback
});
```

### Testing Side Effects (Mock them out)

```typescript
it('saves settings via IPC', async () => {
  const saveMock = vi.fn();
  mockCommand('save_settings', saveMock);
  
  await saveSettings({ theme: 'dark' });
  expect(saveMock).toHaveBeenCalledWith({ theme: 'dark' });
});
```

## Next Steps

1. **Write tests for new features** before implementation (TDD)
2. **Add integration tests** for complex state workflows
3. **Increase coverage** to 80%+ in domain layer
4. **Document test patterns** specific to ThirdScreen features

---

**Remember**: Tests are documentation that executes. Write them for future maintainers (including yourself).
