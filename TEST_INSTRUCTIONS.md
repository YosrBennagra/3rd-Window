# Context Menu Fix Test Instructions

## Problem Found
The deep link protocol `thirdscreen://` was NOT registered in Windows Registry, so clicking the context menu did nothing because Windows didn't know how to handle the URL.

## Fix Applied
Updated `src-tauri/src/context_menu.rs` to register the protocol handler when enabling the context menu.

## How to Test

1. **Wait for app to start** (check terminal output for "Running app.exe")

2. **Enable context menu** in app settings:
   - Open Settings Panel
   - Go to Advanced tab
   - Enable "Desktop Context Menu"

3. **Verify protocol registration**:
   ```powershell
   .\check-registry.ps1
   ```
   Should now show "Protocol registered: thirdscreen://"

4. **Test context menu**:
   - Right-click on desktop background
   - Look for "ThirdScreen - Add Widget"
   - Click it
   - Widget picker window should open in desktop mode

5. **Test deep link directly**:
   ```powershell
   .\test-deeplink.ps1
   ```
   Should open the widget picker

## Expected Log Output

When deep link triggers, you should see in the terminal:
```
[EVENT] Deep link event triggered!
[EVENT] Received 1 URL(s)
[EVENT] URL[0]: thirdscreen://open-picker
[DEEP_LINK] Handler called with 1 URLs
[DEEP_LINK] Processing URL: 'thirdscreen://open-picker'
[DEEP_LINK] ✓ Matched open-picker command
[DEEP_LINK] Calling open_widget_picker_desktop_mode...
[PICKER] open_widget_picker_desktop_mode called
[PICKER] Creating new widget-picker window
[PICKER] URL: /#/widget-picker?mode=desktop
[PICKER] ✓ Window created successfully
```

## If Still Not Working

1. Check if protocol is registered: `.\check-registry.ps1`
2. Try disabling and re-enabling context menu in settings
3. Try manual deep link test: `.\test-deeplink.ps1`
4. Check terminal for error messages
5. Verify app is running as the same exe path in registry
