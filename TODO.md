# ThirdScreen - Development Roadmap

> **Project Goal:** Build a modern, lightweight third-screen dashboard application using Tauri v2, React 18, and TypeScript. The app displays system metrics, widgets, and notifications on a secondary monitor.

---

## 📋 Phase 0: Foundation & Setup

### Step 0.1: Project Initialization ✅
- [x] Initialize Node.js project (`npm init`)
- [x] Set up package.json with dependencies
- [x] Configure TypeScript (`tsconfig.json`)
- [x] Set up Vite for fast development (`vite.config.ts`)
- [x] Create .gitignore file
- [x] Create basic interface with 1 static widget (Clock) and settings panel

**Dependencies to install:**
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "zustand": "^4.5.2",
  "@tauri-apps/api": "^2.0.0",
  "typescript": "^5.6.0",
  "vite": "^5.4.0",
  "@vitejs/plugin-react": "^4.3.0"
}
```

---

### Step 0.2: Tauri Setup ⏹️
- [ ] Install Tauri CLI (`npm install -D @tauri-apps/cli@latest`)
- [ ] Initialize Tauri project (`npm run tauri init`)
- [ ] Configure `src-tauri/tauri.conf.json`
  - [ ] Set window properties (always-on-top, frameless, transparent)
  - [ ] Configure security (CSP)
  - [ ] Set app identifier and name
- [ ] Test basic Tauri app launch

**Required Rust dependencies in `Cargo.toml`:**
```toml
[dependencies]
tauri = { version = "2", features = ["devtools"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

---

### Step 0.3: Project Structure ⏹️
Create organized folder structure:
```
ThirdScreen/
├── docs/               # ✅ Already exists
├── src/
│   ├── components/     # React components
│   ├── services/       # API and service layer
│   ├── state/          # Zustand store
│   ├── theme/          # CSS and styling
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component
│   └── index.tsx       # Entry point
├── src-tauri/
│   ├── src/
│   │   └── main.rs     # Rust backend
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/             # Static assets
└── index.html          # HTML entry
```

---

## 📋 Phase 1: Core Backend (Rust/Tauri)

### Step 1.1: System Metrics Collection ⏹️
- [ ] Add `sysinfo = "0.30"` to Cargo.toml
- [ ] Create `get_system_metrics` Tauri command
- [ ] Implement CPU usage tracking
- [ ] Implement temperature sensor detection (CPU/GPU)
- [ ] Implement memory usage (RAM)
- [ ] Implement disk usage
- [ ] Test metrics retrieval

**Metrics to collect:**
```rust
struct SystemMetrics {
    cpu_usage: f32,      // 0-100%
    cpu_temp: f32,       // Celsius
    gpu_temp: f32,       // Celsius
    ram_used_bytes: u64,
    ram_total_bytes: u64,
    disk_used_bytes: u64,
    disk_total_bytes: u64,
    net_up_mbps: f32,    // Network upload speed
    net_down_mbps: f32,  // Network download speed
}
```

---

### Step 1.2: Window Management Commands ⏹️
- [ ] Implement `set_always_on_top` command
- [ ] Implement `set_fullscreen` command
- [ ] Implement `get_monitors` command (list available displays)
- [ ] Implement `move_to_monitor` command
- [ ] Test window positioning on multiple monitors

---

### Step 1.3: Storage & Settings ⏹️
- [ ] Implement settings persistence (use Tauri's store or localStorage)
- [ ] Create settings schema
- [ ] Add version migration support
- [ ] Test save/load settings

---

## 📋 Phase 2: Frontend Foundation

### Step 2.1: Design System ⏹️
- [ ] Create CSS custom properties (colors, spacing, typography)
- [ ] Define color palette (dark theme first)
- [ ] Set up glassmorphism styles
- [ ] Create responsive grid system
- [ ] Define animation keyframes
- [ ] Document design tokens

**Color scheme:**
```css
--color-bg-primary: #0a0e1a;
--color-accent-primary: #6366f1;
--color-accent-secondary: #8b5cf6;
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-blur: blur(20px);
```

---

### Step 2.2: State Management (Zustand) ⏹️
- [ ] Create main store structure
- [ ] Add metrics state
- [ ] Add settings state
- [ ] Add widget visibility/order state
- [ ] Implement refresh mechanism
- [ ] Add localStorage persistence
- [ ] Create selectors for components

---

### Step 2.3: Core Services ⏹️
- [ ] Create `system-metrics.ts` service (calls Tauri backend)
- [ ] Create `storage.ts` service (localStorage wrapper)
- [ ] Create `settings.ts` service
- [ ] Add error handling and fallbacks
- [ ] Add TypeScript types for all services

---

## 📋 Phase 3: Basic UI Components

### Step 3.1: Layout Components ⏹️
- [ ] Create `App.tsx` (main container)
- [ ] Create `WidgetHost.tsx` (widget grid container)
- [ ] Create `WidgetFrame.tsx` (individual widget wrapper)
- [ ] Implement responsive grid layout
- [ ] Add loading states
- [ ] Add empty states

---

### Step 3.2: Settings Panel ⏹️
- [ ] Create `SettingsPanel.tsx` (sidebar overlay)
- [ ] Add tabs/sections for organization
- [ ] Implement Escape key to close
- [ ] Add animations (slide in/out)
- [ ] Style with glassmorphism
- [ ] Add settings icon button

---

### Step 3.3: Widget Management UI ⏹️
- [ ] Create `WidgetManager.tsx` (enable/disable widgets)
- [ ] Create `AddWidgetModal.tsx` (add new widgets)
- [ ] Show widget visibility toggles
- [ ] Show widget scale controls (S/M/L)
- [ ] Add context menu for quick actions
- [ ] Add floating action button (+ to add widgets)

---

## 📋 Phase 4: System Monitoring Widgets

### Step 4.1: Temperature Widget ⏹️
- [ ] Create `Temperature.tsx` component
- [ ] Display CPU usage percentage
- [ ] Display CPU temperature with color coding
- [ ] Display GPU temperature (when available)
- [ ] Add status indicators (normal/warning/critical)
- [ ] Add animated progress bars
- [ ] Style with modern design system

**Thresholds:**
- CPU: Normal <70°C, Warning 70-80°C, Critical >80°C
- GPU: Normal <75°C, Warning 75-85°C, Critical >85°C

---

### Step 4.2: RAM Usage Widget ⏹️
- [ ] Create `RamUsage.tsx` component
- [ ] Display memory percentage
- [ ] Display used/total memory
- [ ] Add animated progress bar with glow
- [ ] Add color coding based on usage
- [ ] Format bytes nicely (GB/TB)

---

### Step 4.3: Disk Usage Widget ⏹️
- [ ] Create `DiskUsage.tsx` component
- [ ] Display disk usage percentage
- [ ] Show used/free space breakdown
- [ ] Add dual-card layout
- [ ] Add progress bar with shine effect
- [ ] Add hover effects

---

### Step 4.4: Network Speed Widget ⏹️
- [ ] Create `NetworkSpeed.tsx` component
- [ ] Display download speed
- [ ] Display upload speed
- [ ] Add animated progress bars
- [ ] Add speed status indicator
- [ ] Style with gradient cards

---

## 📋 Phase 5: Utility Widgets

### Step 5.1: Clock & Calendar ⏹️
- [ ] Create `ClockCalendar.tsx` component
- [ ] Display current time (HH:MM:SS)
- [ ] Display current date
- [ ] Add timezone support
- [ ] Add 12/24 hour format toggle
- [ ] Style with clean typography

---

### Step 5.2: Notes Widget ⏹️
- [ ] Create `Notes.tsx` component
- [ ] Allow adding/editing/deleting notes
- [ ] Persist notes to localStorage
- [ ] Add markdown support (optional)
- [ ] Add color tags (optional)
- [ ] Style as sticky notes

---

### Step 5.3: Shortcuts Widget ⏹️
- [ ] Create `Shortcuts.tsx` component
- [ ] Display configurable app shortcuts
- [ ] Add click handlers to launch apps
- [ ] Add icons for visual recognition
- [ ] Allow editing shortcuts in settings

---

## 📋 Phase 6: Advanced Features

### Step 6.1: Alerts System ⏹️
- [ ] Create `Alerts.tsx` component
- [ ] Create `AlertRulesManager.tsx` for settings
- [ ] Implement rule engine (threshold-based)
- [ ] Add alert types (info/warning/critical)
- [ ] Add visual/audio notifications
- [ ] Persist alert rules to storage
- [ ] Add alert history

**Example rules:**
- CPU temp > 80°C → Warning
- RAM usage > 90% → Critical
- Disk space < 10% → Warning

---

### Step 6.2: Notifications ⏹️
- [ ] Create `Notifications.tsx` component
- [ ] Integrate with system notifications (Tauri)
- [ ] Add notification queue
- [ ] Add dismiss functionality
- [ ] Add notification preferences
- [ ] Style with toast-style UI

---

### Step 6.3: Monitor Selection ⏹️
- [ ] Add monitor picker dropdown in settings
- [ ] Display available monitors with names/resolutions
- [ ] Implement move window to selected monitor
- [ ] Remember preferred monitor in settings
- [ ] Add "Move to Monitor X" quick action

---

## 📋 Phase 7: Polish & Optimization

### Step 7.1: Performance ⏹️
- [ ] Optimize refresh intervals (configurable)
- [ ] Add power-saving mode (reduce updates)
- [ ] Lazy-load widgets
- [ ] Debounce settings saves
- [ ] Profile and optimize rendering
- [ ] Test with all widgets enabled

---

### Step 7.2: Responsive Design ⏹️
- [ ] Test on 1920×1080 resolution
- [ ] Test on 1366×768 resolution (small screens)
- [ ] Test on 4K resolution
- [ ] Add responsive grid breakpoints
- [ ] Ensure all widgets scale properly
- [ ] Test with different widget scales (S/M/L)

---

### Step 7.3: Error Handling ⏹️
- [ ] Add error boundaries for React components
- [ ] Add fallback UI for failed widgets
- [ ] Add retry mechanisms for backend calls
- [ ] Log errors to console with context
- [ ] Display user-friendly error messages
- [ ] Test error scenarios

---

### Step 7.4: Accessibility ⏹️
- [ ] Add ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Add focus indicators
- [ ] Test with screen readers
- [ ] Ensure sufficient color contrast
- [ ] Add reduced motion support

---

## 📋 Phase 8: Testing & QA

### Step 8.1: Manual Testing ⏹️
- [ ] Test all widgets display correctly
- [ ] Test metrics accuracy (compare with Task Manager)
- [ ] Test settings persistence
- [ ] Test monitor switching
- [ ] Test window controls (always-on-top, fullscreen)
- [ ] Test on different hardware configurations
- [ ] Test with GPU vs no GPU

---

### Step 8.2: Automated Tests (Optional) ⏹️
- [ ] Set up Jest for unit tests
- [ ] Write tests for state management
- [ ] Write tests for utility functions
- [ ] Set up Playwright for E2E tests
- [ ] Write E2E test for basic user flow

---

## 📋 Phase 9: Build & Distribution

### Step 9.1: Production Build ⏹️
- [ ] Configure production build settings
- [ ] Test production build locally
- [ ] Optimize bundle size
- [ ] Add app icons (Windows/Mac/Linux)
- [ ] Configure auto-updates (optional)
- [ ] Test on target platforms

---

### Step 9.2: Documentation ⏹️
- [ ] Update README.md with features
- [ ] Add installation instructions
- [ ] Add usage guide
- [ ] Add configuration guide
- [ ] Add troubleshooting section
- [ ] Add screenshots/GIFs

---

### Step 9.3: Release ⏹️
- [ ] Create GitHub release
- [ ] Upload binaries (.exe, .dmg, .AppImage)
- [ ] Write release notes
- [ ] Tag version (v1.0.0)
- [ ] Share on relevant communities

---

## 📊 Progress Tracking

**Current Status:** � In Progress - Basic interface created!

### Quick Stats
- **Total Steps:** ~120
- **Completed:** 1 (Step 0.1)
- **In Progress:** Phase 0
- **Remaining:** 119

### Time Estimates
- Phase 0: ~2 hours (Setup)
- Phase 1: ~4 hours (Backend)
- Phase 2: ~3 hours (Frontend Foundation)
- Phase 3: ~4 hours (Basic UI)
- Phase 4: ~6 hours (System Widgets)
- Phase 5: ~4 hours (Utility Widgets)
- Phase 6: ~6 hours (Advanced Features)
- Phase 7: ~4 hours (Polish)
- Phase 8: ~3 hours (Testing)
- Phase 9: ~2 hours (Distribution)

**Total Estimated Time:** ~38 hours

---

## 🎯 Next Action

**START HERE:** Phase 0, Step 0.1 - Project Initialization

Run:
```bash
cd e:\ThirdScreen
npm init -y
npm install react react-dom zustand
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react @tauri-apps/cli
```

Then update this file with ✅ for completed steps!

---

## 📝 Notes

- Each checkbox can be marked with ✅ when complete
- Update PROGRESS.md after completing major phases
- Refer to `docs/` folder for detailed specifications
- Test frequently, especially after completing each widget
- Commit code after each phase completion

---

**Remember:** Take it step by step. Don't skip ahead. Test thoroughly. Build it right! 🚀
