# Testing Quick Reference

## Commands

```bash
npm test                  # Watch mode
npm run test:ui           # Visual UI
npm run test:run          # Run once (CI)
npm run test:coverage     # Coverage report
```

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from './module';

describe('yourFunction', () => {
  it('does something correctly', () => {
    expect(yourFunction(input)).toBe(expected);
  });

  it('handles edge cases', () => {
    expect(yourFunction(null)).toBe(fallback);
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestStore } from '@/test/mocks/zustand';
import { mockCommand } from '@/test/mocks/tauri';

describe('Feature Integration', () => {
  beforeEach(() => {
    // Setup
  });

  it('works end-to-end', async () => {
    mockCommand('get_data', mockData);
    // ... test code
  });
});
```

## Test Helpers

```typescript
// Mock Tauri
import { mockCommand, mockCommands } from '@/test/mocks/tauri';
mockCommand('get_monitors', [{ ... }]);

// Mock data
import { createMockMetrics, createMockWidget } from '@/test/utils/test-helpers';
const metrics = createMockMetrics({ cpuUsage: 85 });

// Mock time
import { mockTime, resetTime } from '@/test/utils/test-helpers';
mockTime(1704067200000);

// Create test store
import { createTestStore } from '@/test/mocks/zustand';
const store = createTestStore<State>(storeCreator);
```

## Coverage Targets

- Domain Logic: **>80%**
- Application: **>60%**
- Rust Backend: **>70%**

## Best Practices

✅ **Do:**
- Test domain logic (pure functions)
- Mock external dependencies
- Use descriptive test names
- Test edge cases

❌ **Don't:**
- Test React internals
- Test Tauri APIs (mock them)
- Use real time/dates
- Test implementation details

## Rust Tests

```bash
cd src-tauri
cargo test                     # All tests
cargo test validation          # Specific module
cargo test -- --nocapture      # Show output
```

## Debugging

```bash
# Run single file
npm test src/domain/formatters/system.test.ts

# Run tests matching pattern
npm test -- -t "formatBytes"

# Debug with inspector
npm test -- --inspect-brk
```

## CI/CD

Tests run automatically on:
- Every push (build.yml)
- Every PR
- Before release

## File Structure

```
src/
├── domain/              # Unit tests here ★★★
│   ├── formatters/
│   │   ├── system.ts
│   │   └── system.test.ts
│   └── calculators/
│       ├── grid.ts
│       └── grid.test.ts
├── application/         # Integration tests
│   └── stores/
│       └── gridStore.integration.test.ts
└── test/               # Test infrastructure
    ├── setup.ts
    ├── mocks/
    └── utils/
```

## Quick Wins

1. **Add unit test** for new domain logic
2. **Mock IPC** for integration tests
3. **Use test helpers** (createMock*, mockCommand)
4. **Run in watch mode** during development
5. **Check coverage** before PRs
