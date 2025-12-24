# Windows OS Integration

Complete guide to ThirdScreen's Windows OS integration layer.

## Overview

ThirdScreen integrates deeply with Windows OS to provide a native, polished experience:
- **System Tray**: Always-accessible app control
- **Context Menu**: Right-click desktop to add widgets
- **Protocol Handler**: `thirdscreen://` deep links
- **Startup Management**: Optional Windows startup
- **Registry Access**: Minimal, scoped, reversible

## Design Principles

ThirdScreen follows strict OS integration principles from `docs/skills/os-integration-windows/skill.md`:

### 1. Principle of Least Surprise
- Behavior matches user expectations from other Windows apps
- No hidden features or surprise activations
- Clear, predictable integration

### 2. Principle of Least Privilege
- Only HKCU registry (no admin required)
- Minimal OS feature surface area
- Only requests necessary permissions

### 3. Reversibility
- All changes can be undone
- Clean uninstall removes all traces
- No orphaned registry keys

### 4. Security First
- No arbitrary code execution
- Protocol URL validation with whitelisting
- No shell command injection vectors

### 5. User Control
- Never auto-enables features
- Easy toggle on/off in settings
- Explicit consent before OS integration

## Architecture

```
src-tauri/src/
├── system/windows_integration/    # Windows OS integration (logic layer)
│   ├── mod.rs                     # Module structure & initialization
│   ├── context_menu.rs            # Desktop context menu integration
│   ├── protocol.rs                # Protocol handler validation
│   ├── registry_utils.rs          # Safe registry access utilities
│   ├── startup.rs                 # Windows startup management
│   └── tray_menu.rs               # System tray menu structure
│
└── commands/                      # Tauri IPC command layer
    ├── context_menu.rs            # Context menu commands (delegates to system)
    └── windows_integration.rs     # Startup & registry commands
```

## Features

### 1. System Tray

**Location**: `src-tauri/src/system/windows_integration/tray_menu.rs`

Always-visible system tray icon providing quick access:

**Menu Structure**:
```
ThirdScreen (icon)
├── Show Dashboard
├── ───────────────
├── Add Widget to Desktop ▶
│   ├── Clock
│   ├── Temperature
│   ├── RAM Monitor
│   ├── Disk Monitor
│   └── Network Monitor
├── ───────────────
└── Quit
```

**Interactions**:
- **Left-click icon**: Show main dashboard window
- **Right-click icon**: Show context menu
- **Menu items**: Trigger app commands

**Implementation**:
```rust
use crate::system::windows_integration::tray_menu;

// In lib.rs setup
tray_menu::create_system_tray(app)?;
```

### 2. Context Menu

**Location**: `src-tauri/src/system/windows_integration/context_menu.rs`

Right-click desktop to add widgets.

**Registry Keys**:
```
# Classic Context Menu (Windows 10)
HKCU:\Software\Classes\DesktopBackground\Shell\ThirdScreen
  @                     = "ThirdScreen - Add Widget"
  Icon                  = "<exe>,0"
  Position              = "Bottom"
  \command
    @                   = "thirdscreen://open-picker"

# Modern Context Menu (Windows 11+)
HKCU:\Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}
  @                     = "ThirdScreen Widget Picker"
  Icon                  = "<exe>,0"
  \InprocServer32
    @                   = ""  # Empty = load Windows shell handler
```

**Security**:
- Uses `thirdscreen://` protocol (not direct shell execution)
- No arbitrary command execution
- URL validation before action

**Frontend Commands**:
```typescript
import { invoke } from '@tauri-apps/api/core';

// Enable context menu
await invoke('enable_context_menu');

// Disable context menu
await invoke('disable_context_menu');

// Check status
const installed = await invoke<boolean>('check_context_menu_installed');
```

### 3. Protocol Handler

**Location**: `src-tauri/src/system/windows_integration/protocol.rs`

Handles `thirdscreen://` URLs from Windows.

**Supported URLs**:
```
thirdscreen://open-picker          → Open widget picker window
thirdscreen://show-dashboard       → Show main dashboard
thirdscreen://add-widget/clock     → Add specific widget to desktop
```

**Explicitly Blocked**:
```
thirdscreen://exec/*               ✗ No arbitrary execution
thirdscreen://shell/*              ✗ No shell commands
file:///                           ✗ No file paths
http://                            ✗ No network URLs
```

**Registry Keys**:
```
HKCU:\Software\Classes\thirdscreen
  @                     = "URL:ThirdScreen Protocol"
  URL Protocol          = ""
  \DefaultIcon
    @                   = "<exe>,0"
  \shell\open\command
    @                   = "<exe> "%1""
```

**Validation Example**:
```rust
use crate::system::windows_integration::protocol;

// Validate URL before executing
if let Some(action) = protocol::validate_protocol_url(url) {
    match action {
        ProtocolAction::OpenPicker => open_widget_picker(app),
        ProtocolAction::ShowDashboard => show_dashboard(app),
        ProtocolAction::AddWidget(widget_type) => spawn_widget(app, widget_type),
    }
} else {
    eprintln!("Invalid protocol URL: {}", url);
}
```

### 4. Startup Management

**Location**: `src-tauri/src/system/windows_integration/startup.rs`

Optional Windows startup integration.

**Registry Key**:
```
HKCU:\Software\Microsoft\Windows\CurrentVersion\Run
  ThirdScreen = "<exe>"
```

**User Control**:
- Never auto-enables
- Easy toggle in settings
- Clear indication of status

**Frontend Commands**:
```typescript
import { invoke } from '@tauri-apps/api/core';

// Enable startup
await invoke('enable_startup');

// Disable startup
await invoke('disable_startup');

// Check status
const enabled = await invoke<boolean>('check_startup_enabled');

// Toggle
const newState = await invoke<boolean>('toggle_startup');
```

### 5. Registry Utilities

**Location**: `src-tauri/src/system/windows_integration/registry_utils.rs`

Safe registry access for diagnostics and cleanup.

**Functions**:
- `cleanup_all_registry_keys()` - Remove all integration keys (uninstall)
- `has_registry_keys()` - Check if any keys exist
- `list_registry_keys()` - Get list of all keys (diagnostics)
- `validate_key_path()` - Ensure path is safe and allowed

**Allowed Registry Paths**:
```
Software\Classes\thirdscreen
Software\Classes\DesktopBackground\Shell\ThirdScreen
Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}
Software\Microsoft\Windows\CurrentVersion\Run
```

**Frontend Commands**:
```typescript
// List all registry keys (diagnostics)
const keys = await invoke<string[]>('list_integration_registry_keys');
console.log('Registry keys:', keys);

// Check if keys exist
const exists = await invoke<boolean>('check_registry_keys_exist');
```

## Initialization

Windows integration is initialized during app startup:

```rust
// In src-tauri/src/lib.rs
use crate::system::windows_integration;

#[cfg(target_os = "windows")]
fn setup_windows_integration<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    windows_integration::initialize_windows_integration(app)?;
    Ok(())
}
```

## Cleanup / Uninstall

All integration can be cleaned up during uninstall:

```rust
use crate::system::windows_integration;

// Full cleanup (removes all registry keys)
windows_integration::cleanup_windows_integration(false)?;

// Cleanup but keep user settings
windows_integration::cleanup_windows_integration(true)?;
```

## Frontend Integration

All Windows integration features are controllable from the frontend.

### Settings UI Example

```typescript
import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';

export function WindowsIntegrationSettings() {
  const [contextMenuEnabled, setContextMenuEnabled] = useState(false);
  const [startupEnabled, setStartupEnabled] = useState(false);

  // Load status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    const [contextMenu, startup] = await Promise.all([
      invoke<boolean>('check_context_menu_installed'),
      invoke<boolean>('check_startup_enabled')
    ]);
    setContextMenuEnabled(contextMenu);
    setStartupEnabled(startup);
  }

  async function toggleContextMenu() {
    try {
      if (contextMenuEnabled) {
        await invoke('disable_context_menu');
      } else {
        await invoke('enable_context_menu');
      }
      await loadStatus();
    } catch (error) {
      console.error('Failed to toggle context menu:', error);
    }
  }

  async function toggleStartup() {
    try {
      const newState = await invoke<boolean>('toggle_startup');
      setStartupEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle startup:', error);
    }
  }

  return (
    <div className="windows-integration-settings">
      <h3>Windows Integration</h3>
      
      <label>
        <input
          type="checkbox"
          checked={contextMenuEnabled}
          onChange={toggleContextMenu}
        />
        Enable desktop context menu
      </label>
      
      <label>
        <input
          type="checkbox"
          checked={startupEnabled}
          onChange={toggleStartup}
        />
        Launch ThirdScreen on Windows startup
      </label>
    </div>
  );
}
```

## Security Considerations

### Registry Access

- **Scope**: Only HKCU (current user), never HKLM
- **Validation**: All paths validated before write
- **Cleanup**: All keys tracked and removed on uninstall
- **No Admin**: No UAC prompts required

### Protocol Handler

- **Whitelist**: Only specific actions allowed
- **Validation**: All URLs validated before execution
- **No Shell**: Protocol cannot execute shell commands
- **No Injection**: Widget types sanitized (alphanumeric + hyphen only)

### Context Menu

- **No Direct Execution**: Uses protocol handler, not direct commands
- **Validation**: All URLs validated by protocol handler
- **Limited Scope**: Only desktop background, not files

## Debugging

### Check Integration Status

```typescript
const keys = await invoke<string[]>('list_integration_registry_keys');
console.log('Active registry keys:', keys);

const exists = await invoke<boolean>('check_registry_keys_exist');
console.log('Has registry keys:', exists);
```

### Registry Inspection

Use Windows Registry Editor (`regedit.exe`):

1. **Context Menu**: `HKCU\Software\Classes\DesktopBackground\Shell\ThirdScreen`
2. **Protocol**: `HKCU\Software\Classes\thirdscreen`
3. **Startup**: `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`

### Common Issues

**Context menu not appearing**:
- Check if installed: `check_context_menu_installed()`
- Verify registry key exists
- Restart Windows Explorer: `taskkill /f /im explorer.exe && start explorer`

**Protocol handler not working**:
- Check protocol registration: `validate_protocol_registration()`
- Test URL manually: `start thirdscreen://open-picker`
- Check Windows Event Viewer for errors

**Startup not working**:
- Check registry value: `HKCU\...\Run\ThirdScreen`
- Verify exe path is correct
- Check Windows Task Manager → Startup tab

## Testing

### Manual Testing Checklist

- [ ] System tray icon appears
- [ ] Left-click tray opens dashboard
- [ ] Right-click tray shows menu
- [ ] Context menu appears on desktop
- [ ] Context menu opens widget picker
- [ ] Protocol URLs work (`thirdscreen://open-picker`)
- [ ] Startup toggle works
- [ ] All features can be disabled
- [ ] Uninstall removes all registry keys

### Automated Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_protocol_validation() {
        assert!(validate_protocol_url("thirdscreen://open-picker").is_some());
        assert!(validate_protocol_url("http://evil.com").is_none());
    }

    #[test]
    fn test_registry_path_validation() {
        assert!(validate_key_path(r"Software\Classes\thirdscreen"));
        assert!(!validate_key_path(r"SYSTEM"));
    }
}
```

## Roadmap

Future enhancements:

1. **Windows 11 Modern Menu**: Enhanced modern context menu styling
2. **Jump Lists**: Recent widgets in taskbar jump list
3. **Notifications**: Windows native notifications
4. **Quick Actions**: Taskbar thumbnail buttons
5. **Share Target**: Accept files via Windows Share menu

## References

- [Windows Shell Extensions](https://docs.microsoft.com/en-us/windows/win32/shell/shell-exts)
- [Protocol Handler Registration](https://docs.microsoft.com/en-us/windows/win32/shell/launch)
- [System Tray Guidelines](https://docs.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/notification-area)
- [Tauri Deep Links](https://tauri.app/v2/guides/distribution/deep-linking/)

## License

Windows integration follows ThirdScreen's MIT license (see `docs/legal/license.md`).

---

**Last Updated**: 2025-06-01  
**Module Version**: 1.0.0  
**Tauri Version**: 2.x  
**Windows Support**: Windows 10+ (all editions)
