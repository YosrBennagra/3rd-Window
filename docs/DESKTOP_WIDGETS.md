# Desktop Widgets Feature

## Overview
Widgets can now be "popped out" from the main dashboard grid and placed directly on your desktop as individual, draggable windows - just like classic Windows gadgets!

## Features

### ✨ What's New
- **Pop-out widgets**: Right-click any widget → "Pop Out to Desktop"
- **Draggable on desktop**: Hover over a desktop widget to see the drag handle
- **Persistent positions**: Widget positions are saved and restored on app restart
- **Frameless & transparent**: Clean glassmorphism design
- **Always on top**: Widgets stay visible over other windows
- **Independent windows**: Each widget runs in its own window

### 🎯 User Experience
1. **Create widgets** in the main dashboard grid
2. **Right-click** any widget to open context menu
3. **Select "Pop Out to Desktop"**
4. Widget becomes an independent desktop window
5. **Hover to show drag handle** (⋮⋮ at the top)
6. **Drag anywhere** on your desktop
7. Positions automatically saved

### 🏗️ Architecture

#### Frontend (TypeScript/React)
- **DesktopWidget.tsx**: Wrapper component with drag handling
- **DesktopWidgetApp.tsx**: Router for desktop widget windows
- **services/desktop-widgets.ts**: Tauri command wrappers
- **store/desktopWidgetStore.ts**: State management (future use)
- **types/desktop-widget.ts**: TypeScript interfaces

#### Backend (Rust)
- **widget_windows.rs**: Window management module
- Spawns frameless, transparent windows
- Persists widget configs to `desktop_widgets.json`
- Tracks active widgets in memory

#### Commands
- `spawn_desktop_widget`: Create new desktop widget window
- `close_desktop_widget`: Close and remove widget
- `update_widget_position`: Save new position while dragging
- `update_widget_size`: Resize widget (future)
- `get_desktop_widgets`: Load saved widgets on startup

### 🎨 Styling
- Glassmorphism: `backdrop-filter: blur(20px)`
- Drag handle appears on hover
- Smooth transitions (200ms)
- Semi-transparent backgrounds

### 📁 File Locations

**Frontend:**
```
src/
├── components/
│   ├── DesktopWidget.tsx        # Widget wrapper
│   └── DesktopWidget.css        # Styles
├── DesktopWidgetApp.tsx         # Desktop widget router
├── services/
│   └── desktop-widgets.ts       # API calls
├── store/
│   └── desktopWidgetStore.ts    # State (unused yet)
└── types/
    └── desktop-widget.ts        # Interfaces
```

**Backend:**
```
src-tauri/src/
└── widget_windows.rs            # Window management
```

### 🔄 Data Flow

1. **Pop-out trigger**: Grid → Context menu → `handlePopOutWidget()`
2. **Spawn window**: Frontend calls `spawnDesktopWidget(config)`
3. **Rust creates**: Frameless window at `/#/desktop-widget?id=X&type=Y`
4. **Router loads**: DesktopWidgetApp → DesktopWidget → Widget component
5. **Drag handling**: Mouse events → `updateWidgetPosition()` → Rust
6. **Persistence**: Rust saves to `desktop_widgets.json` on each change

### 🚀 Future Enhancements
- [ ] Restore desktop widgets on app startup
- [ ] Resize desktop widgets
- [ ] Click-through mode (optional)
- [ ] Widget grouping
- [ ] Snap to screen edges
- [ ] Multi-monitor awareness
- [ ] Widget-specific settings in desktop mode
- [ ] Close button on widgets
- [ ] Minimize to tray

### 🐛 Known Limitations
- Desktop widgets don't auto-restore on restart yet (need to load from store)
- No resize handles (size is fixed from grid size)
- No close button (must close from main app)
- Dev URL hardcoded for localhost:5173

### 🧪 Testing
```bash
npm run tauri:dev
```

1. Add a widget to the grid (Clock, System Monitor, etc.)
2. Right-click widget → "Pop Out to Desktop"
3. Widget appears as separate window
4. Hover to show drag handle
5. Drag to new position
6. Check persistence: Close app, reopen, widgets should restore (WIP)

### 📝 Code Example

**Pop out a widget programmatically:**
```typescript
import { spawnDesktopWidget } from './services/desktop-widgets';

await spawnDesktopWidget({
  widgetId: 'unique-id',
  widgetType: 'clock',
  x: 100,
  y: 100,
  width: 300,
  height: 200,
});
```

**Update position:**
```typescript
import { updateWidgetPosition } from './services/desktop-widgets';

await updateWidgetPosition('widget-id', 150, 150);
```

### 🎯 Integration with Existing Code
- Main dashboard grid remains unchanged
- Widgets work in both grid and desktop mode
- Same widget components used for both modes
- Settings/state management kept separate
- No breaking changes to existing features
