  # TypeScript Strict Mode Implementation

## Overview

ThirdScreen enforces **TypeScript strict mode** throughout the codebase to ensure type safety, prevent runtime errors, and improve code maintainability. This document outlines our strict mode practices, common patterns, and migration guidelines.

## Strict Mode Configuration

Our `tsconfig.json` enables all strict mode checks:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### What This Enables

| Check | Description | Example Error |
|-------|-------------|---------------|
| `strict` | Master strict flag (enables all below) | - |
| `noImplicitAny` | No `any` without explicit annotation | `function foo(x)` ❌ |
| `strictNullChecks` | `null`/`undefined` must be handled | `value.length` without null check ❌ |
| `strictFunctionTypes` | Strict contravariance for functions | Function type mismatches ❌ |
| `strictBindCallApply` | Type-check `.bind()`, `.call()`, `.apply()` | Wrong argument types ❌ |
| `strictPropertyInitialization` | Class properties must be initialized | Uninitialized class fields ❌ |
| `noUnusedLocals` | No unused variables | `const unused = 5;` ❌ |
| `noUnusedParameters` | No unused function parameters | `(unused, used) => used` ❌ |
| `noFallthroughCasesInSwitch` | Switch cases must break/return | Missing `break` ❌ |

## Type Safety Principles

### 1. No `any` Types

**Never** use `any` except in extreme edge cases with explicit comments.

❌ **Bad:**
```typescript
function processData(data: any) {
  return data.value;
}
```

✅ **Good:**
```typescript
function processData(data: unknown): number {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    const { value } = data as { value: unknown };
    if (typeof value === 'number') {
      return value;
    }
  }
  throw new Error('Invalid data format');
}
```

### 2. Use `unknown` for Uncertain Types

When you don't know the type, use `unknown` (not `any`) and narrow with type guards:

```typescript
// ✅ Safe handling of unknown data
function parseJson(json: string): unknown {
  return JSON.parse(json);
}

function processUser(data: unknown): User {
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  return data; // TypeScript knows it's User now
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}
```

### 3. Explicit Return Types

Always annotate function return types for public APIs:

```typescript
// ✅ Clear contract
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ⚠️ Acceptable for private functions (inferred)
function sumPrices(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### 4. Exhaustive Union Handling

Use `never` checks to ensure all cases are handled:

```typescript
type WidgetMode = 'dashboard' | 'desktop' | 'both';

function renderWidget(mode: WidgetMode): ReactNode {
  switch (mode) {
    case 'dashboard':
      return <DashboardWidget />;
    case 'desktop':
      return <DesktopWidget />;
    case 'both':
      return <BothWidget />;
    default:
      // ✅ TypeScript error if we add a new mode and forget to handle it
      const _exhaustive: never = mode;
      throw new Error(`Unhandled mode: ${_exhaustive}`);
  }
}
```

### 5. Type Guards for Runtime Safety

Create type predicates for validation:

```typescript
// ✅ Type guard function
function isNetworkStats(value: unknown): value is NetworkStats {
  return (
    typeof value === 'object' &&
    value !== null &&
    'downloadSpeed' in value &&
    'uploadSpeed' in value &&
    typeof (value as NetworkStats).downloadSpeed === 'number'
  );
}

// Usage:
const data = await invoke<unknown>('get_network_stats');
if (isNetworkStats(data)) {
  console.log(data.downloadSpeed); // ✅ TypeScript knows the type
}
```

## Branded Types

Use branded types to prevent accidental mixing of semantically different values:

```typescript
import { 
  WidgetInstanceId, 
  createWidgetInstanceId,
  MonitorId,
  createMonitorId 
} from '../types/branded';

// ✅ Type-safe IDs
const widgetId: WidgetInstanceId = createWidgetInstanceId('clock-1');
const monitorId: MonitorId = createMonitorId(0);

function deleteWidget(id: WidgetInstanceId): void {
  // Implementation
}

deleteWidget(widgetId); // ✅ Correct
deleteWidget(monitorId); // ❌ TypeScript error: type mismatch
deleteWidget('clock-1'); // ❌ TypeScript error: need branded type
```

### Available Branded Types

See [src/types/branded.ts](../types/branded.ts) for the complete list:

- **Identifiers:** `WidgetInstanceId`, `WidgetTypeId`, `AlertRuleId`, `AlertInstanceId`, `MonitorId`
- **Time:** `Milliseconds`, `Seconds`
- **Paths:** `AbsolutePath`, `HttpUrl`
- **Metrics:** `Percentage`

## Common Patterns

### Pattern 1: Widget Component Props

All widget components receive typed props:

```typescript
import type { WidgetComponentProps } from '../domain/contracts/WidgetContract';

function ClockWidget({ 
  widgetId, 
  size, 
  settings, 
  mode, 
  onIntent 
}: WidgetComponentProps): JSX.Element {
  // settings is Record<string, unknown>
  // Use type narrowing for specific widget settings:
  const clockSettings = ensureClockWidgetSettings(settings);
  
  return <div>{/* ... */}</div>;
}
```

### Pattern 2: Settings Type Narrowing

Widget settings use `Record<string, unknown>` for flexibility. Narrow types when needed:

```typescript
interface ClockWidgetSettings {
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  dateFormat: 'short' | 'long';
}

function ensureClockWidgetSettings(
  settings: Record<string, unknown>
): ClockWidgetSettings {
  return {
    timeFormat: settings.timeFormat === '24h' ? '24h' : '12h',
    showSeconds: settings.showSeconds === true,
    dateFormat: settings.dateFormat === 'long' ? 'long' : 'short',
  };
}
```

### Pattern 3: IPC Type Safety

Type IPC commands with proper return types:

```typescript
// ✅ Typed IPC calls
import type { SystemMetrics, NetworkStats } from '../types/ipc';

const metrics = await invoke<SystemMetrics>('get_system_metrics');
const network = await invoke<NetworkStats>('get_network_stats');

// ❌ Never use 'any'
const data = await invoke<any>('some_command'); // Bad!
```

### Pattern 4: Window Type Extensions

Use module augmentation for window extensions:

```typescript
// ✅ Type-safe window extensions
declare global {
  interface Window {
    performanceMonitoring?: PerformanceMonitoringAPI;
  }
}

// Now this is type-safe:
window.performanceMonitoring?.logPerformanceSummary();
```

### Pattern 5: Unsafe Casts (Last Resort)

If you **must** use type assertions, prefer `as unknown as T` over `as any`:

```typescript
// ⚠️ Acceptable for type erasure (documented reason)
// Settings are type-erased to Record<string, unknown> for storage
const settings = ensureClockWidgetSettings(widget.settings) as unknown as Record<string, unknown>;

// ❌ Never do this
const settings = widget.settings as any; // Bad!
```

## Migration Guide

### Fixing `any` Types

1. **Identify the real type:**
   ```typescript
   // Before:
   const data: any = await fetch('/api/data');
   
   // After:
   interface ApiResponse {
     status: string;
     data: User[];
   }
   const data: ApiResponse = await fetch('/api/data');
   ```

2. **Use `unknown` if type is truly unknown:**
   ```typescript
   // Before:
   function process(input: any) { /* ... */ }
   
   // After:
   function process(input: unknown) {
     if (typeof input === 'string') {
       // Handle string
     } else if (typeof input === 'number') {
       // Handle number
     }
   }
   ```

3. **Create type guards:**
   ```typescript
   function isValidConfig(value: unknown): value is AppConfig {
     return (
       typeof value === 'object' &&
       value !== null &&
       'apiKey' in value &&
       typeof (value as AppConfig).apiKey === 'string'
     );
   }
   ```

### Fixing Implicit `any`

TypeScript infers `any` in some cases. Make types explicit:

```typescript
// ❌ Implicit any
const items = []; // any[]
items.push({ id: 1 }); // No error, but unsafe

// ✅ Explicit type
const items: Item[] = [];
items.push({ id: 1 }); // Type-checked!
```

### Fixing `strictNullChecks` Errors

Handle `null`/`undefined` explicitly:

```typescript
// ❌ Might be null
function getLength(str: string | null) {
  return str.length; // Error: str might be null
}

// ✅ Null-safe
function getLength(str: string | null): number {
  return str?.length ?? 0;
}

// Or with early return:
function getLength(str: string | null): number {
  if (str === null) return 0;
  return str.length; // TypeScript knows str is string here
}
```

## Testing Type Safety

Our test infrastructure also enforces strict types:

```typescript
// ✅ Fully typed tests
import { describe, it, expect } from 'vitest';
import { formatBytes } from './formatters/system';

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    const result: string = formatBytes(0);
    expect(result).toBe('0.0 B');
  });
  
  it('formats kilobytes', () => {
    const result: string = formatBytes(1024);
    expect(result).toBe('1.0 KB');
  });
});
```

## Performance Considerations

Strict mode has **zero runtime cost**. All type checking happens at compile time:

- ✅ No runtime type checks added
- ✅ No bundle size increase
- ✅ Generates identical JavaScript
- ✅ Catches errors before deployment

## Troubleshooting

### "Type 'X' is not assignable to type 'Y'"

1. Check if you're using the correct type
2. Add type guards if needed
3. Consider if `X` should actually be `Y`
4. Use type narrowing: `if (typeof x === 'string')`

### "Object is possibly 'null'"

1. Add null check: `if (obj !== null)`
2. Use optional chaining: `obj?.property`
3. Use nullish coalescing: `obj ?? defaultValue`

### "Property 'X' does not exist on type 'Y'"

1. Verify the type definition includes the property
2. Add the property to the interface
3. Use type guards to narrow the type
4. Check for typos in property names

## Resources

- **TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook/intro.html
- **Strict Mode Guide:** https://www.typescriptlang.org/tsconfig#strict
- **Type Guards:** https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- **Branded Types:** See [src/types/branded.ts](../types/branded.ts)

## Quick Reference

```typescript
// ✅ DO
unknown               // For uncertain types
Type guards          // Narrow unknown to specific types
Explicit returns     // Function return type annotations
Branded types        // Prevent ID mixing
Record<string, unknown> // For flexible objects (better than any)

// ❌ DON'T
any                  // Disables type checking
Type assertions      // Bypasses type safety (use sparingly)
Implicit types       // Makes code less maintainable
@ts-ignore          // Suppresses errors (never use)
Non-null assertions  // value! (use only when certain)
```

## Enforcement

Strict mode is enforced by:

1. **Compiler:** `tsc` fails on type errors
2. **Editor:** VS Code shows errors inline
3. **CI/CD:** Build fails if types don't match
4. **Code Review:** Manual verification

---

**Last Updated:** Skill 13 (TypeScript Strict Mode) - 2024
**Maintainer:** ThirdScreen Development Team
