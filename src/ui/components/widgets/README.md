# Widget Systems Documentation

ThirdScreen has **two distinct widget systems** that serve different purposes:

## 🪟 Desktop Widgets (`widgets/desktop/`)

**Purpose:** Standalone floating widgets that appear as separate windows on the desktop.

**Characteristics:**
- Each widget is a separate Tauri window
- Can be positioned anywhere on screen
- Supports transparency and always-on-top
- User can drag, resize, and customize
- Managed by `widgetRegistry` and `DesktopWidget` wrapper

**Available Widgets:**
- ClockWidget
- TimerWidget
- ActivityWidget
- ImageWidget
- VideoWidget
- NotesWidget
- QuickLinksWidget
- NetworkMonitorWidget
- TemperatureWidget
- RamUsageWidget
- DiskUsageWidget
- PDFWidget

**Usage:**
```tsx
import { ClockWidget } from './components/widgets/desktop';

// Widgets receive a WidgetLayout prop with configuration
<ClockWidget widget={widgetLayout} />
```

**Registration:**
Desktop widgets are registered in `src/config/widgetRegistry.ts` and can be spawned via the desktop widget picker.

---

## 📊 Panel Widgets (`widgets/panel/`)

**Purpose:** Dashboard widgets that appear in the main application panel.

**Characteristics:**
- Rendered within the main application window
- Arranged in a grid layout via `WidgetHost`
- Support power saving modes
- Managed by Zustand state
- Wrapped in `WidgetFrame` for consistent styling

**Available Widgets:**
- Temperature
- RamUsage
- DiskUsage
- NetworkSpeed
- ClockCalendar
- Notes
- Alerts
- Shortcuts
- Integrations
- Pipelines
- PowerMode
- Notifications

**Usage:**
```tsx
import { Temperature } from './components/widgets/panel';

// Panel widgets have no props - they fetch data internally
<WidgetFrame title="Temperature">
  <Temperature />
</WidgetFrame>
```

**Configuration:**
Panel widgets are configured in `src/config/widgets.ts` and managed by `WidgetHost` component.

---

## 🔧 Shared Utilities (`widgets/shared/`)

**Components:**
- `WidgetErrorBoundary` - Catches and displays errors in both widget systems

---

## 📝 Adding New Widgets

### Desktop Widget

1. Create component in `widgets/desktop/YourWidget.tsx`
2. Export from `widgets/desktop/index.ts`
3. Register in `src/config/widgetRegistry.ts`
4. Add constraints to `src/domain/config/widgetConstraints.ts`
5. Add to desktop widget picker options

### Panel Widget

1. Create component in `widgets/panel/YourWidget.tsx`
2. Export from `widgets/panel/index.ts`
3. Add to `widgetMap` in `WidgetHost.tsx`
4. Add definition to `src/config/widgets.ts`
5. Widget will appear in main dashboard

---

## 🎨 Styling

- **Desktop widgets:** Use component-level CSS or co-located stylesheets
- **Panel widgets:** Use global widget styles from `src/theme/components/`
- Both systems support custom themes and scale options

---

## 🔍 Architecture

```
widgets/
├── desktop/           # Floating window widgets
│   ├── ClockWidget.tsx
│   ├── WidgetContextMenu.tsx (desktop-specific menu)
│   └── index.ts
├── panel/             # Dashboard grid widgets
│   ├── Temperature.tsx
│   └── index.ts
└── shared/            # Shared utilities
    ├── WidgetErrorBoundary.tsx
    └── index.ts
```

**Key Differences:**

| Feature | Desktop Widgets | Panel Widgets |
|---------|----------------|---------------|
| Window | Separate Tauri window | Main application |
| State | Per-widget settings | Global Zustand store |
| Lifecycle | Spawn/close independently | Always rendered |
| Wrapper | `DesktopWidget` | `WidgetFrame` |
| Registry | `widgetRegistry` | `widgetDefinitions` |
| Props | `{ widget: WidgetLayout }` | None (internal fetch) |

---

## 🚀 Best Practices

1. **Desktop widgets** should be self-contained and handle their own state
2. **Panel widgets** should use Zustand selectors for minimal re-renders
3. Use `WidgetErrorBoundary` to prevent crashes
4. Follow React 18 best practices (hooks, effects, memoization)
5. Keep widgets performant - use appropriate refresh intervals
6. Document widget-specific settings and configurations
