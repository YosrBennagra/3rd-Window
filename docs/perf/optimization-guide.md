# Performance Optimization Guide

## Overview

ThirdScreen implements comprehensive performance optimizations across React rendering, IPC communication, and system resource usage. This document details the strategies, implementations, and monitoring tools.

## Key Performance Principles

### 1. Optimize the Hot Paths
Focus on frequently-executed code:
- Widget polling (2-5s intervals)
- Zustand state subscriptions
- IPC calls to backend
- Clock/timer updates
- Drag/resize operations

### 2. Reduce Re-Renders
- Use shallow comparison for Zustand selectors
- Separate state and actions
- Memoize expensive computations
- Track render frequency in development

### 3. Minimize IPC Traffic
- Increase refresh intervals for slow-changing metrics
- Pause updates when window is hidden
- Batch multiple requests where possible
- Track IPC call frequency and duration

### 4. Resource-Aware Updates
- Use requestAnimationFrame for visual updates
- Respect document visibility (pause when hidden)
- Configure intervals based on metric change rate

## Implementation Details

### Zustand Optimization (`src/utils/performance.ts`)

#### Shallow Selectors
Combine multiple state slices into a single subscription with shallow comparison:

```typescript
// ❌ Before: Multiple subscriptions
const settingsOpen = useStore((state) => state.settingsOpen);
const settings = useStore((state) => state.settings);
const monitors = useStore((state) => state.monitors);

// ✅ After: Single subscription with shallow
const { settingsOpen, settings, monitors } = useStore(
  (state) => ({
    settingsOpen: state.settingsOpen,
    settings: state.settings,
    monitors: state.monitors,
  }),
  shallow
);
```

**Impact**: Reduces re-renders from N subscriptions to 1, only triggers when selected state actually changes.

#### Value Selectors
For primitive values that don't need shallow comparison:

```typescript
const createValueSelector = <T>(selector: (state: AppState) => T) => {
  return (state: AppState) => selector(state);
};

// Usage
const isFullscreen = useStore(createValueSelector(state => state.settings.isFullscreen));
```

#### Action Selectors
Actions don't cause re-renders, memoize them:

```typescript
const createActionSelector = <T extends (...args: any[]) => any>(
  selector: (state: AppState) => T
) => {
  const cache = new WeakMap<AppState, T>();
  return (state: AppState) => {
    if (!cache.has(state)) {
      cache.set(state, selector(state));
    }
    return cache.get(state)!;
  };
};
```

### System Metrics Hooks (`src/hooks/useSystemMetrics.ts`)

Performance-optimized hooks that replace direct `setInterval + invoke` patterns.

#### Features
1. **Configurable Intervals**: Adjust polling rate based on metric change frequency
2. **Visibility Detection**: Auto-pause when document is hidden
3. **Immediate Resume**: Fetch fresh data when becoming visible
4. **Centralized Logic**: Consistent polling behavior across widgets

#### Usage Examples

```typescript
// RAM Usage (slow-changing, 3s interval)
const { metrics } = useSystemMetrics({
  refreshInterval: 3000,
  pauseWhenHidden: true,
});

// Network Stats (configurable by user)
const { stats } = useNetworkStats({
  refreshInterval: settings.refreshInterval,
  pauseWhenHidden: true,
});

// Temperatures (slowest, 3s+ interval)
const { temps } = useSystemTemperatures({
  refreshInterval: 3000,
  pauseWhenHidden: true,
});
```

#### Intervals by Metric Type
- **Fast-changing** (Network, CPU): 1-2 seconds
- **Medium-changing** (RAM, GPU): 2-3 seconds
- **Slow-changing** (Disk, Temps): 3-5 seconds
- **Very slow** (Disk space): 10+ seconds

### Clock Optimization

The clock widget uses `requestAnimationFrame` instead of `setInterval` for smoother updates and better performance:

```typescript
// ❌ Before: setInterval fires every second regardless
useEffect(() => {
  const id = setInterval(() => setNow(new Date()), 1000);
  return () => clearInterval(id);
}, []);

// ✅ After: RAF only updates state when second changes
useEffect(() => {
  const animate = () => {
    const current = new Date();
    const currentSecond = current.getSeconds();

    if (currentSecond !== lastSecondRef.current) {
      setNow(current);
      lastSecondRef.current = currentSecond;
    }

    frameRef.current = requestAnimationFrame(animate);
  };

  frameRef.current = requestAnimationFrame(animate);
  return () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
  };
}, []);
```

**Benefits**:
- Syncs with browser paint cycle (smoother)
- Only triggers re-render when second actually changes
- Automatically pauses when tab is hidden (browsers optimize RAF)

### IPC Tracking (`src/utils/performanceMonitoring.ts`)

All IPC calls are automatically tracked via `trackedInvoke` wrapper:

```typescript
async function trackedInvoke<T>(command: string, args?: Record<string, any>): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await invoke<T>(command, args);
    const duration = performance.now() - startTime;
    trackIpcCall(command, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackIpcCall(`${command}_ERROR`, duration);
    throw error;
  }
}
```

**Tracked Metrics**:
- Call count per command
- Total duration
- Average duration
- Last call timestamp
- Error rates

### Render Tracking

Components can opt-in to render frequency monitoring:

```typescript
export function DraggableGrid() {
  useRenderTracking('DraggableGrid');
  // ...rest of component
}
```

**Warnings**:
- Logs warning every 10 renders
- Tracks average render interval
- Helps identify excessive re-renders

## Monitoring & Debugging

### Browser Console

In development mode, performance data is automatically logged every 30 seconds.

Manual inspection:
```javascript
// View render metrics
window.performanceMonitoring.getRenderMetrics()

// View IPC metrics
window.performanceMonitoring.getIpcMetrics()

// Log full summary
window.performanceMonitoring.logPerformanceSummary()

// Reset tracking
window.performanceMonitoring.resetRenderMetrics()
window.performanceMonitoring.resetIpcMetrics()
```

### Performance Summary Output

```
🎯 Performance Summary
  📊 Render Metrics
  ┌──────────────────┬─────────┬─────────────────┐
  │ Component        │ Renders │ Avg Interval ms │
  ├──────────────────┼─────────┼─────────────────┤
  │ DraggableGrid    │ 42      │ 1250.33         │
  │ ClockCalendar    │ 180     │ 1000.12         │
  │ RamUsageWidget   │ 15      │ 3000.50         │
  └──────────────────┴─────────┴─────────────────┘

  🔌 IPC Metrics
  ┌──────────────────────┬───────┬────────────┬──────────┐
  │ Command              │ Calls │ Total (ms) │ Avg (ms) │
  ├──────────────────────┼───────┼────────────┼──────────┤
  │ get_system_metrics   │ 45    │ 892.40     │ 19.83    │
  │ get_network_stats    │ 30    │ 445.20     │ 14.84    │
  │ get_system_temps     │ 20    │ 180.50     │ 9.03     │
  └──────────────────────┴───────┴────────────┴──────────┘
```

## Optimization Checklist

When adding new features:

### React Components
- [ ] Use shallow selectors for multiple Zustand state slices
- [ ] Separate actions from state subscriptions
- [ ] Add `useRenderTracking` for performance-critical components
- [ ] Memoize expensive computations with `useMemo`
- [ ] Memoize callbacks passed to children with `useCallback`

### Widget Polling
- [ ] Use appropriate hook from `useSystemMetrics.ts`
- [ ] Choose interval based on metric change rate (1-10s)
- [ ] Enable `pauseWhenHidden: true`
- [ ] Consider caching/debouncing for very frequent updates

### IPC Calls
- [ ] All calls go through `src/services/ipc.ts` (automatic tracking)
- [ ] Validate inputs before invoking
- [ ] Handle errors gracefully
- [ ] Consider batching multiple related calls

### Timers & Animations
- [ ] Use `requestAnimationFrame` for visual updates
- [ ] Only update state when value changes (not every frame)
- [ ] Clean up timers/RAF in useEffect return
- [ ] Respect document visibility

## Performance Budget

Target metrics for production:

| Metric | Target | Critical |
|--------|--------|----------|
| Initial load | < 1s | < 2s |
| Time to interactive | < 1.5s | < 3s |
| Widget render | < 16ms | < 32ms |
| IPC call average | < 50ms | < 100ms |
| Memory usage | < 150MB | < 300MB |
| Re-renders per second | < 5 | < 10 |

### Measuring

```javascript
// Check current performance
const renders = window.performanceMonitoring.getRenderMetrics();
const ipc = window.performanceMonitoring.getIpcMetrics();

// Calculate re-renders per second
renders.forEach(r => {
  const rps = 1000 / r.averageRenderInterval;
  console.log(`${r.componentName}: ${rps.toFixed(2)} renders/sec`);
});

// Check IPC call frequency
ipc.forEach(i => {
  console.log(`${i.command}: ${i.callCount} calls, ${i.averageDuration.toFixed(2)}ms avg`);
});
```

## Common Performance Issues

### Issue: Component re-renders too frequently

**Symptoms**: `useRenderTracking` logs warnings, UI feels sluggish

**Diagnosis**:
1. Check `window.performanceMonitoring.getRenderMetrics()`
2. Look for high render counts or low average intervals
3. Identify the component

**Solutions**:
1. Combine multiple Zustand subscriptions with shallow
2. Move actions to separate selectors
3. Memoize props passed to children
4. Consider React.memo for pure components

### Issue: High IPC traffic

**Symptoms**: CPU usage high, battery drain, slow responses

**Diagnosis**:
1. Check `window.performanceMonitoring.getIpcMetrics()`
2. Look for high call counts
3. Identify frequently-called commands

**Solutions**:
1. Increase polling intervals for slow-changing metrics
2. Enable `pauseWhenHidden` for visibility-aware polling
3. Batch multiple related requests
4. Cache results client-side where appropriate

### Issue: Clock/timer performance

**Symptoms**: High CPU in profiler, frequent re-renders

**Solutions**:
1. Use `requestAnimationFrame` instead of `setInterval`
2. Only update state when displayed value changes
3. Avoid re-rendering on every frame
4. Use CSS animations where possible

### Issue: Drag/resize lag

**Symptoms**: Ghost widget lags behind cursor

**Diagnosis**:
1. Check if DraggableGrid has high render count
2. Profile during drag operation
3. Look for expensive computations in render

**Solutions**:
1. Memoize collision detection calculations
2. Throttle position updates
3. Use CSS transforms instead of layout changes
4. Reduce number of active subscriptions

## Advanced Optimization

### Intersection Observer

For widgets off-screen:
```typescript
const observerRef = useRef<IntersectionObserver | null>(null);
const [isVisible, setIsVisible] = useState(true);

useEffect(() => {
  observerRef.current = new IntersectionObserver(
    ([entry]) => setIsVisible(entry.isIntersecting),
    { threshold: 0.1 }
  );

  if (widgetRef.current) {
    observerRef.current.observe(widgetRef.current);
  }

  return () => observerRef.current?.disconnect();
}, []);

// Pause updates when not visible
useSystemMetrics({
  refreshInterval: isVisible ? 2000 : 10000,
  pauseWhenHidden: true,
});
```

### Web Workers

For expensive computations (future consideration):
```typescript
// Offload heavy processing to worker
const worker = new Worker(new URL('./metrics-processor.worker.ts', import.meta.url));

worker.postMessage({ type: 'process', data: rawMetrics });
worker.onmessage = (e) => {
  if (e.data.type === 'result') {
    setProcessedMetrics(e.data.result);
  }
};
```

### Virtual Scrolling

If widget list grows large:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: widgets.length,
  getScrollElement: () => gridRef.current,
  estimateSize: () => 200, // Average widget height
  overscan: 3,
});
```

## References

- [React Performance](https://react.dev/learn/render-and-commit)
- [Zustand Best Practices](https://github.com/pmndrs/zustand#best-practices)
- [Web Performance APIs](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Performance Budget](../architecture/performance-budget.md)
- [Widget Development](../widgets/WIDGET_STATUS.md)
- [State Management](../architecture/state-model.md)
