import { describe, it, expect } from 'vitest'
import type { DesktopWidgetConfig, DesktopWidgetInstance, WidgetMetadata } from './desktop-widget'

describe('desktop-widget types', () => {
  it('creates valid DesktopWidgetConfig', () => {
    const config: DesktopWidgetConfig = {
      widgetId: 'w1',
      widgetType: 'clock',
      x: 100,
      y: 200,
      width: 300,
      height: 150,
      monitorIndex: 0,
    }

    expect(config.widgetId).toBe('w1')
    expect(config.x).toBe(100)
    expect(config.monitorIndex).toBe(0)
  })

  it('creates DesktopWidgetInstance with active state', () => {
    const instance: DesktopWidgetInstance = {
      widgetId: 'w1',
      widgetType: 'clock',
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      isActive: true,
      lastMoved: new Date(),
    }

    expect(instance.isActive).toBe(true)
    expect(instance.lastMoved).toBeInstanceOf(Date)
  })

  it('creates valid WidgetMetadata', () => {
    const metadata: WidgetMetadata = {
      type: 'system-monitor',
      defaultWidth: 300,
      defaultHeight: 200,
      minWidth: 200,
      minHeight: 150,
      title: 'System Monitor',
      icon: 'monitor',
    }

    expect(metadata.type).toBe('system-monitor')
    expect(metadata.defaultWidth).toBeGreaterThanOrEqual(metadata.minWidth)
    expect(metadata.defaultHeight).toBeGreaterThanOrEqual(metadata.minHeight)
  })

  it('allows optional fields to be omitted', () => {
    const config: DesktopWidgetConfig = {
      widgetId: 'w2',
      widgetType: 'notes',
      x: 0,
      y: 0,
      width: 400,
      height: 300,
    }

    expect(config.monitorIndex).toBeUndefined()
  })
})
