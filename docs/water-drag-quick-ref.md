# Quick Reference: Water Drag vs Preview Drag

## Visual Comparison

### Preview-Based Drag (BEFORE)
```
┌────────────────────────────┐
│ [A] [B] [C]               │  User drags B
│                           │
│ [A] [░] [C]  ←ghost→  B  │  Original position shows placeholder
│     ↑                     │  Grid cell highlights show drop target
│   hover                   │
│   preview                 │
└────────────────────────────┘
```

### Water Drag (AFTER)
```
┌────────────────────────────┐
│ [A] [B] [C]               │  User drags B
│                           │
│ [A] [C] [D]  ←ghost→  B  │  Grid already reordered
│     ↑                     │  No placeholder, no preview
│   live                    │  Position implied by where [C] moved
│   reflow                  │
└────────────────────────────┘
```

## Code Changes Summary

### CSS
| Style | Before | After | Why |
|-------|--------|-------|-----|
| `.grid-widget--dragging` | `opacity: 0.3` | `opacity: 0` | Completely hide placeholder |
| `.grid-cell--hover` | Blue background | Empty rule | No preview highlight |
| `.grid-cell--invalid` | Red background | Empty rule | No error preview |
| `.grid-widget` | No transition | `transform 0.35s spring` | Smooth reflow |
| `.grid-widget--ghost` | `scale(1.05)` | `scale(1.08) rotate(2deg)` | More pronounced lift |

### JavaScript/TypeScript
| Component | Change | Purpose |
|-----------|--------|---------|
| `GridCells.tsx` | Removed hover/invalid logic | No preview rendering |
| `DraggableGrid.tsx` | Pass `null`/`false` for preview states | Disable preview system |
| `useGridDrag.ts` | No changes needed | Already does live reflow! |

## Animation Timing

```
User action          Grid response
    │                    │
    ├─ Long press        │
    │  (400ms)           │
    │                    │
    ├─ Widget lifts ─────┤
    │  (instant)         │
    │                    │
    ├─ Cursor moves ─────┤
    │  (instant)         │
    │                    ├─ Other widgets slide
    │                    │  (350ms spring)
    │                    │
    ├─ Release ──────────┤
    │                    ├─ Ghost disappears
    │                    │  Widget settles
    │                    │  (350ms)
```

## Performance Budget

- **Target FPS**: 60fps (16.67ms/frame)
- **Drag updates**: Every frame via `requestAnimationFrame`
- **CSS transitions**: GPU-accelerated (transform only)
- **No layout recalc**: Grid uses explicit grid positions
- **Memory**: Minimal (no shadow DOM, no preview clones)

## UX Principles Applied

1. **Direct Manipulation**: Ghost = actual item being moved
2. **Immediate Feedback**: Grid updates as you move, not after
3. **Reversibility**: Escape cancels, smooth animation back
4. **Natural Physics**: Spring timing feels organic
5. **No Mode Errors**: Can't drop in invalid location (grid won't reflow there)

## Testing Checklist

- [ ] Long-press activates drag (400ms)
- [ ] Ghost follows cursor smoothly
- [ ] Other widgets slide out of way
- [ ] No placeholder visible at original position
- [ ] No grid cell highlights
- [ ] Escape cancels drag
- [ ] Drop commits already-visible layout
- [ ] Animations feel smooth (60fps)
- [ ] Works with different widget sizes
- [ ] Multiple widgets can be dragged in sequence

---

**Key Insight**: Preview is redundant when reflow is instant. The grid's actual movement *is* the preview.
