import { describe, it, expect } from 'vitest'
import type { GridConfig, WidgetLayout, LayoutState, WidgetConstraints, LayoutOperation } from './layout'

describe('layout types', () => {
  it('creates valid GridConfig', () => {
    const grid: GridConfig = {
      columns: 12,
      rows: 8,
    }

    expect(grid.columns).toBe(12)
    expect(grid.rows).toBe(8)
  })

  it('creates valid WidgetLayout', () => {
    const layout: WidgetLayout = {
      id: 'widget-1',
      widgetType: 'clock',
      x: 0,
      y: 0,
      width: 3,
      height: 2,
      locked: false,
      settings: { format: '24h' },
    }

    expect(layout.id).toBe('widget-1')
    expect(layout.settings?.format).toBe('24h')
  })

  it('creates valid LayoutState', () => {
    const state: LayoutState = {
      grid: { columns: 12, rows: 8 },
      widgets: [
        { id: 'w1', widgetType: 'clock', x: 0, y: 0, width: 3, height: 2 },
        { id: 'w2', widgetType: 'notes', x: 3, y: 0, width: 4, height: 3 },
      ],
      version: 1,
    }

    expect(state.widgets).toHaveLength(2)
    expect(state.version).toBe(1)
  })

  it('creates valid WidgetConstraints', () => {
    const constraints: WidgetConstraints = {
      minWidth: 2,
      minHeight: 2,
      maxWidth: 6,
      maxHeight: 6,
    }

    expect(constraints.maxWidth).toBeGreaterThanOrEqual(constraints.minWidth)
    expect(constraints.maxHeight).toBeGreaterThanOrEqual(constraints.minHeight)
  })

  describe('LayoutOperation types', () => {
    it('creates addWidget operation', () => {
      const op: LayoutOperation = {
        type: 'addWidget',
        widgetType: 'timer',
        layout: {
          id: 'w1',
          x: 0,
          y: 0,
          width: 3,
          height: 2,
          locked: false,
        },
      }

      expect(op.type).toBe('addWidget')
      if (op.type === 'addWidget') {
        expect(op.widgetType).toBe('timer')
      }
    })

    it('creates moveWidget operation', () => {
      const op: LayoutOperation = {
        type: 'moveWidget',
        id: 'w1',
        x: 5,
        y: 3,
      }

      expect(op.type).toBe('moveWidget')
      if (op.type === 'moveWidget') {
        expect(op.x).toBe(5)
        expect(op.y).toBe(3)
      }
    })

    it('creates resizeWidget operation', () => {
      const op: LayoutOperation = {
        type: 'resizeWidget',
        id: 'w1',
        width: 4,
        height: 3,
        x: 1,
        y: 2,
      }

      expect(op.type).toBe('resizeWidget')
      if (op.type === 'resizeWidget') {
        expect(op.width).toBe(4)
        expect(op.height).toBe(3)
      }
    })

    it('creates removeWidget operation', () => {
      const op: LayoutOperation = {
        type: 'removeWidget',
        id: 'w1',
      }

      expect(op.type).toBe('removeWidget')
      if (op.type === 'removeWidget') {
        expect(op.id).toBe('w1')
      }
    })

    it('creates setWidgetLock operation', () => {
      const op: LayoutOperation = {
        type: 'setWidgetLock',
        id: 'w1',
        locked: true,
      }

      expect(op.type).toBe('setWidgetLock')
      if (op.type === 'setWidgetLock') {
        expect(op.locked).toBe(true)
      }
    })

    it('creates setWidgetSettings operation', () => {
      const op: LayoutOperation = {
        type: 'setWidgetSettings',
        id: 'w1',
        settings: { theme: 'dark', fontSize: 14 },
      }

      expect(op.type).toBe('setWidgetSettings')
      if (op.type === 'setWidgetSettings') {
        expect(op.settings.theme).toBe('dark')
      }
    })
  })
})
