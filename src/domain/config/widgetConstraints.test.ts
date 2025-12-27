import { describe, it, expect } from 'vitest'
import {
  CLOCK_CONSTRAINTS,
  TIMER_CONSTRAINTS,
  ACTIVITY_CONSTRAINTS,
  IMAGE_CONSTRAINTS,
  VIDEO_CONSTRAINTS,
  NOTES_CONSTRAINTS,
  QUICKLINKS_CONSTRAINTS,
  NETWORK_MONITOR_CONSTRAINTS,
  TEMPERATURE_CONSTRAINTS,
  RAM_CONSTRAINTS,
  DISK_CONSTRAINTS,
  PDF_CONSTRAINTS,
  WIDGET_CONSTRAINTS,
  getWidgetConstraints,
} from './widgetConstraints'

describe('widgetConstraints', () => {
  it('defines valid constraints for all widget types', () => {
    const constraints = [
      CLOCK_CONSTRAINTS,
      TIMER_CONSTRAINTS,
      ACTIVITY_CONSTRAINTS,
      IMAGE_CONSTRAINTS,
      VIDEO_CONSTRAINTS,
      NOTES_CONSTRAINTS,
      QUICKLINKS_CONSTRAINTS,
      NETWORK_MONITOR_CONSTRAINTS,
      TEMPERATURE_CONSTRAINTS,
      RAM_CONSTRAINTS,
      DISK_CONSTRAINTS,
      PDF_CONSTRAINTS,
    ]

    constraints.forEach((constraint) => {
      expect(constraint.minWidth).toBeGreaterThan(0)
      expect(constraint.minHeight).toBeGreaterThan(0)
      expect(constraint.maxWidth).toBeGreaterThanOrEqual(constraint.minWidth)
      expect(constraint.maxHeight).toBeGreaterThanOrEqual(constraint.minHeight)
    })
  })

  it('clock and timer have same fixed constraints', () => {
    expect(CLOCK_CONSTRAINTS).toEqual(TIMER_CONSTRAINTS)
  })

  it('media widgets allow flexible sizing', () => {
    expect(IMAGE_CONSTRAINTS.maxWidth).toBeGreaterThan(IMAGE_CONSTRAINTS.minWidth)
    expect(VIDEO_CONSTRAINTS.maxWidth).toBeGreaterThan(VIDEO_CONSTRAINTS.minWidth)
  })

  it('system monitors have reasonable size ranges', () => {
    expect(TEMPERATURE_CONSTRAINTS.minWidth).toBe(3)
    expect(RAM_CONSTRAINTS.minHeight).toBe(3)
    expect(DISK_CONSTRAINTS.maxHeight).toBeLessThanOrEqual(6)
  })
})

describe('getWidgetConstraints', () => {
  it('returns constraints for known widget type', () => {
    const constraints = getWidgetConstraints('clock')
    
    expect(constraints).toBe(CLOCK_CONSTRAINTS)
  })

  it('returns default constraints for unknown widget type', () => {
    const constraints = getWidgetConstraints('unknown-widget')
    
    expect(constraints).toEqual({
      minWidth: 2,
      minHeight: 2,
      maxWidth: 12,
      maxHeight: 12,
    })
  })

  it('accesses WIDGET_CONSTRAINTS registry correctly', () => {
    expect(WIDGET_CONSTRAINTS['timer']).toBe(TIMER_CONSTRAINTS)
    expect(WIDGET_CONSTRAINTS['activity']).toBe(ACTIVITY_CONSTRAINTS)
    expect(WIDGET_CONSTRAINTS['network-monitor']).toBe(NETWORK_MONITOR_CONSTRAINTS)
  })
})
