# ThirdScreen Architecture

## Project Structure

```
src/
├── components/           # React components
│   ├── widgets/         # Widget components (Clock, CPU/GPU temps, etc.)
│   │   ├── ClockWidget.tsx
│   │   ├── CpuTempWidget.tsx
│   │   ├── GpuTempWidget.tsx
│   │   └── index.ts
│   ├── settings/        # Settings panel components
│   │   └── SettingsPanel.tsx
│   ├── ui/              # Reusable UI components
│   │   ├── ContextMenu.tsx
│   │   └── index.ts
│   └── layout/          # Layout components
│       └── WidgetGrid.tsx
├── hooks/               # Custom React hooks
│   ├── useContextMenu.ts
│   └── useSystemTemps.ts
├── types/               # TypeScript type definitions
│   ├── widget.ts
│   └── system.ts
├── config/              # Configuration and registries
│   └── widgetRegistry.ts
├── store.ts             # Zustand state management
├── App.tsx              # Main application component
├── App.css              # Global styles
├── main.tsx             # Application entry point
└── index.css            # Base styles

src-tauri/
├── src/
│   ├── main.rs          # Tauri entry point
│   └── lib.rs           # Tauri commands and logic
├── Cargo.toml           # Rust dependencies
└── tauri.conf.json      # Tauri configuration
```

## Architecture Principles

### 1. Separation of Concerns
- **Components**: Pure UI presentation logic
- **Hooks**: Reusable stateful logic
- **Store**: Centralized state management
- **Types**: Type safety across the application
- **Config**: Application configuration and registries

### 2. Component Organization

#### Widgets (`components/widgets/`)
- Self-contained widget components
- Each widget has its own file
- Includes context menu integration
- Exports through `index.ts` barrel file

#### Settings (`components/settings/`)
- Settings panel and related components
- Manages app configuration UI

#### UI (`components/ui/`)
- Reusable UI components (buttons, modals, etc.)
- Context menus, dialogs, etc.

#### Layout (`components/layout/`)
- Layout containers (grids, panels, etc.)

### 3. Custom Hooks

#### `useContextMenu`
- Manages context menu state and behavior
- Handles click-outside-to-close
- Provides position tracking

#### `useSystemTemps`
- Fetches system temperature data
- Auto-refreshes at configurable interval
- Error handling built-in

### 4. Type System

#### `types/widget.ts`
- Widget configuration interface
- Widget instance interface
- Context menu types

#### `types/system.ts`
- System monitoring types
- Monitor configuration
- App settings

### 5. Widget Registry (`config/widgetRegistry.ts`)
- Central registry of all available widgets
- Widget metadata (name, icon, description)
- Easy addition of new widgets

## Adding a New Widget

1. **Create widget component** in `src/components/widgets/YourWidget.tsx`:
```typescript
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../ui';

export function YourWidget() {
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  
  return (
    <>
      <div className="widget widget--medium" onContextMenu={handleContextMenu}>
        {/* Your widget content */}
      </div>
      
      <ContextMenu
        position={contextMenu}
        title="Your Widget"
        onClose={closeContextMenu}
      />
    </>
  );
}
```

2. **Export from index** in `src/components/widgets/index.ts`:
```typescript
export { YourWidget } from './YourWidget';
```

3. **Register in widget registry** in `src/config/widgetRegistry.ts`:
```typescript
{
  id: 'your-widget',
  name: 'Your Widget',
  description: 'What your widget does',
  icon: '🎯',
  component: YourWidget,
  defaultSize: 'medium',
}
```

4. **Add to App.tsx**:
```typescript
import { YourWidget } from './components/widgets';

// In render:
<WidgetGrid>
  <YourWidget />
</WidgetGrid>
```

## State Management

Uses **Zustand** for lightweight state management:

- `settingsOpen`: Settings panel visibility
- `settings`: App settings (fullscreen, monitor)
- `monitors`: Available monitors
- Actions: `toggleSettings`, `setFullscreen`, `setSelectedMonitor`, etc.

## Backend Integration (Tauri)

Rust commands in `src-tauri/src/lib.rs`:
- `get_system_temps`: Fetch CPU/GPU temperatures
- `get_monitors`: List available displays
- `move_to_monitor`: Move window to specific monitor
- `apply_fullscreen`: Toggle fullscreen mode
- `save_settings` / `load_settings`: Persist configuration

## Styling

- CSS custom properties (variables) in `App.css`
- Glassmorphism design system
- Modular component-specific styles
- Consistent spacing/sizing scale

## Benefits of This Architecture

✅ **Modular**: Each component is self-contained
✅ **Scalable**: Easy to add new widgets and features
✅ **Maintainable**: Clear separation of concerns
✅ **Type-safe**: Full TypeScript coverage
✅ **Reusable**: Shared hooks and components
✅ **Testable**: Components can be tested in isolation
✅ **Documented**: Clear structure and patterns

## Development Workflow

1. Run dev server: `npm run tauri:dev`
2. Add new widget: Follow steps in "Adding a New Widget"
3. Create reusable logic: Add to `hooks/`
4. Add types: Update `types/` files
5. Update registry: Register in `config/widgetRegistry.ts`
