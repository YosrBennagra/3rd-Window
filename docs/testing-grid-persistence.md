# Testing Grid Measurement Persistence

## The Fix

**Problem**: Grid column/row sizes were being reset on app restart due to resize handler overwriting restored values.

**Solution**: 
- Added `hasRestoredLayoutRef` to track if layout has been initialized
- Separated initial load/compute from resize handling
- Prevent save during first render (only save user changes)
- Fixed dependencies arrays to avoid unnecessary re-runs

## How to Test

### 1. Test Grid Resizer Persistence

**Steps:**
1. Open the app
2. Right-click → "Adjust Grid" (or toggle adjust mode)
3. Drag a column resizer left/right
4. Drag a row resizer up/down
5. Toggle "Adjust Grid" off
6. Close the app completely
7. Reopen the app

**Expected Result:**
✅ Grid columns/rows are exactly the same size as when you closed it
✅ Console shows: `[grid] Restored layout from saved state`

### 2. Test First Run (No Saved State)

**Steps:**
1. Delete the dashboard file:
   ```powershell
   Remove-Item $env:APPDATA\ThirdScreen\dashboard.json
   ```
2. Start the app

**Expected Result:**
✅ Grid has equal-sized columns and rows
✅ Console shows: `[grid] Computed default layout`

### 3. Test Widget + Grid Persistence Together

**Steps:**
1. Add a widget
2. Drag it to a new position
3. Adjust grid column sizes
4. Adjust grid row sizes
5. Close app
6. Reopen app

**Expected Result:**
✅ Widget in correct position
✅ Grid columns/rows same custom sizes
✅ Everything restored perfectly

## Console Logs to Watch For

### On App Load (with saved state):
```
[dashboard] loadDashboard -> { widgets: [...], gridLayout: {...}, version: 1 }
[grid] Restored layout from saved state
```

### On App Load (no saved state):
```
[dashboard] loadDashboard -> { widgets: [], gridLayout: null, version: 1 }
[grid] Computed default layout
```

### When Adjusting Grid:
```
[grid] setGridLayout -> { colWidths: [180, 180, ...], rowHeights: [120, 120, ...] }
[dashboard] saveDashboard -> success
```

## Debugging Commands

### View Saved State
```powershell
cat $env:APPDATA\ThirdScreen\dashboard.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Check if Grid Layout is Saved
```powershell
(cat $env:APPDATA\ThirdScreen\dashboard.json | ConvertFrom-Json).gridLayout
```

Example output:
```json
{
  "colWidths": [180, 180, 180, 180, 180, 180],
  "rowHeights": [120, 120, 120, 120, 120, 120]
}
```

### Reset Everything
```powershell
Remove-Item $env:APPDATA\ThirdScreen\dashboard.json
```

## Common Issues

### Issue: Grid resets on window resize
**Cause**: Resize handler scales proportionally when window size changes (expected behavior)
**Fix**: Not a bug - this is intentional to keep layout valid when window size changes

### Issue: Grid resets on app restart
**Cause**: Either:
1. File not being saved (check console for save errors)
2. File being overwritten (was the original bug, now fixed)
3. File corrupted/invalid (check JSON)

**Debug**:
```powershell
# Check if file exists
Test-Path $env:APPDATA\ThirdScreen\dashboard.json

# Check file contents
cat $env:APPDATA\ThirdScreen\dashboard.json
```

### Issue: Grid saves but doesn't restore
**Cause**: Async loading race condition (should be fixed now)
**Check**: Console logs should show restoration message

## Key Code Changes

### Before (Broken):
```typescript
useEffect(() => {
  compute(); // Always computed, overwriting restored values
  setupResizeHandlers(); // Immediately scaled on first run
}, []); // Ran once but compute() reset everything
```

### After (Fixed):
```typescript
useEffect(() => {
  if (hasSavedLayout) {
    restoreLayout(); // Only restore, don't compute
    hasRestoredLayoutRef.current = true;
  } else {
    computeDefaults(); // Only if no saved state
    hasRestoredLayoutRef.current = true;
  }
}, [gridLayout]); // Re-run when async load completes

useEffect(() => {
  if (!hasRestoredLayoutRef.current) return; // Wait for init
  setupResizeHandlers(); // Only scale on actual window resize
}, []); // Set up once
```

## Success Criteria

✅ Grid measurements persist across app restarts
✅ No flash/reflow on startup
✅ Console logs confirm restoration
✅ File contains correct gridLayout data
✅ Resizing grid triggers save after 500ms
✅ Window resize scales proportionally (keeps layout valid)

---

**Test now**: Adjust your grid, close the app, reopen - sizes should be exactly as you left them!
