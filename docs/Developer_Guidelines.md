
---

# Developer Guidelines

## Adding a New Widget

1. **Create widget component** in `src/ui/components/widgets/`
2. **Register component:**
   ```typescript
   // src/config/widgetRegistry.ts
   import { NewWidget } from '../ui/components/widgets';
   registry.register('new-widget', NewWidget as WidgetComponent);
   ```
3. **Add constraints:**
   ```typescript
   // src/domain/config/widgetConstraints.ts
   export const NEW_WIDGET_CONSTRAINTS: WidgetConstraints = {
     minWidth: 3, minHeight: 3, maxWidth: 8, maxHeight: 8,
   };
   
   export const WIDGET_CONSTRAINTS: Record<string, WidgetConstraints> = {
     // ...
     'new-widget': NEW_WIDGET_CONSTRAINTS,
   };
   ```
4. **Add to definitions** (optional, for picker):
   ```typescript
   // src/config/widgets.ts
   { id: 'new-widget', title: 'New Widget', ... }
   ```

## Adding a Menu Action

1. **Add action type:**
   ```typescript
   // src/application/services/menuActions.ts
   export type MenuActionType = 
     | 'existing-action'
     | 'new-action'; // add here
   ```
2. **Add handler:**
   ```typescript
   export const menuActionHandlers: Record<MenuActionType, Handler> = {
     // ...
     'new-action': async (ctx) => {
       // implementation using ctx dependencies
     },
   };
   ```


# Developer Guidelines

## Adding a New Store Action

```typescript
// ❌ DON'T: Call IPC directly
addWidget: async (type: string) => {
  await invoke('save_widget', { type });
  set((state) => ({ widgets: [...state.widgets, newWidget] }));
}

// ✅ DO: Delegate to service
addWidget: async (type: string) => {
  const newWidget = await widgetService.createWidget(type);
  set((state) => ({ widgets: [...state.widgets, newWidget] }));
}
```

## Creating a New Service

```typescript
/**
 * MyFeatureService (Zustand Architecture Best Practice)
 * 
 * This service handles side effects for MyFeature.
 * Store delegates to these methods instead of calling IPC directly.
 */

export async function performOperation(...): Promise<Result> {
  // 1. Validate inputs
  // 2. Call IPC if needed
  // 3. Handle errors
  // 4. Return result (not state)
}
```

## When to Extract to Service

Extract to service if the action:
- Calls `invoke()` (IPC)
- Performs persistence
- Has complex timing/sequencing
- Needs to be testable in isolation
- Orchestrates multiple operations

---
