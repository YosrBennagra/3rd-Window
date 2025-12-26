# Performance Optimization Guide

## Dynamic Import Warnings

During the build process, you may see warnings about dynamic imports:

```
(!) E:/ThirdScreen/node_modules/@tauri-apps/api/core.js is dynamically imported by 
    E:/ThirdScreen/src/application/services/windowService.ts but also statically 
    imported by other modules...

(!) E:/ThirdScreen/node_modules/@tauri-apps/api/window.js is dynamically imported by 
    E:/ThirdScreen/src/application/services/windowService.ts but also statically 
    imported by other modules...
```

### What This Means

These warnings indicate that Tauri API modules are being imported both:
1. **Statically** - `import { invoke } from '@tauri-apps/api/core'`
2. **Dynamically** - `const { invoke } = await import('@tauri-apps/api/core')`

This prevents Vite from code-splitting the module effectively.

### Current Impact

✅ **Build still works** - No functional issues  
✅ **Bundle size stable** - ~321 KB (within target)  
⚠️ **Code splitting suboptimal** - Could be improved for better caching

### Why It Happens

**windowService.ts** uses dynamic imports for conditional loading:

```typescript
// windowService.ts dynamically imports for lazy loading
const createWindow = async () => {
  const { WebviewWindow } = await import('@tauri-apps/api/window');
  // ... create window
};
```

But other files statically import the same modules:

```typescript
// Other files use static imports
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';
```

### Resolution Options

#### Option 1: Make All Imports Static (Recommended for Now)
**Pros:** Simpler, warnings gone, no code changes needed  
**Cons:** Slightly larger initial bundle (but still acceptable)

```typescript
// Change windowService.ts to use static imports
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';
```

#### Option 2: Make All Imports Dynamic (Future Optimization)
**Pros:** Better code splitting, smaller initial bundle  
**Cons:** Requires refactoring multiple files, more complex

```typescript
// All Tauri API usage becomes async
const metrics = await (async () => {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke('get_system_metrics');
})();
```

#### Option 3: Split Into Separate Chunks (Advanced)
**Pros:** Optimal code splitting  
**Cons:** Requires Vite configuration changes

```javascript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tauri-core': ['@tauri-apps/api/core'],
          'tauri-window': ['@tauri-apps/api/window'],
        },
      },
    },
  },
};
```

### Recommendation

**Current Status: No Action Required**

The warnings are informational and don't affect functionality. The bundle size is well within acceptable limits (~321 KB gzipped to ~92 KB).

**Future Optimization Path:**
1. Keep current approach until bundle size becomes a concern
2. If needed, implement **Option 1** (static imports everywhere)
3. For advanced optimization, consider **Option 3** (manual chunks)

### Monitoring

Track these metrics over time:
- **Build time**: Currently 639ms (excellent)
- **Bundle size**: Currently ~321 KB (good)
- **Gzipped size**: Currently ~92 KB (excellent)

If any of these degrade significantly, revisit optimization options.

---

## Other Performance Optimizations

### 1. Component Lazy Loading
Already implemented for widget components:
```typescript
const ClockWidget = lazy(() => import('./widgets/ClockWidget'));
```

### 2. State Selector Optimization
Using shallow selectors to prevent unnecessary re-renders:
```typescript
import { createShallowSelector } from '@utils/performance';

const selectWidgets = createShallowSelector(
  (state) => state.widgets
);
```

### 3. IPC Performance Tracking
Monitoring IPC call performance:
```typescript
import { trackIpcCall } from '@utils/performanceMonitoring';

const metrics = await trackIpcCall('getSystemMetrics', () =>
  IpcService.getSystemMetrics()
);
```

### 4. Render Tracking
Component render monitoring in development:
```typescript
import { useRenderTracking } from '@utils/performanceMonitoring';

function MyComponent() {
  useRenderTracking('MyComponent');
  // ...
}
```

---

## Build Performance

### Current Metrics (Baseline)
```
Build time: 639ms
Bundle size: 321.38 KB
Gzipped: 91.89 KB
Modules transformed: 147
```

### Targets
- ✅ Build time: < 1000ms
- ✅ Bundle size: < 500 KB
- ✅ Gzipped: < 150 KB

All targets met! 🎉

---

## Related Documentation

- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [Tauri Performance](https://tauri.app/v1/guides/building/performance)
- [React Performance](https://react.dev/learn/render-and-commit#optimizing-performance)
