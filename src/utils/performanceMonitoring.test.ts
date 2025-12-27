import { describe, it, expect, beforeEach } from 'vitest'
import {
  getRenderMetrics,
  resetRenderMetrics,
  trackIpcCall,
  getIpcMetrics,
  resetIpcMetrics,
  resetRenderMetrics as rr,
} from './performanceMonitoring'

import { logPerformanceSummary } from './performanceMonitoring'

describe('performanceMonitoring (utils)', () => {
  beforeEach(() => {
    resetRenderMetrics()
    resetIpcMetrics()
  })

  it('ipc metrics track counts and averages', () => {
    trackIpcCall('cmdA', 100)
    trackIpcCall('cmdA', 300)
    trackIpcCall('cmdB', 50)

    const ipc = getIpcMetrics()
    // cmdA should be first because higher callCount
    expect(ipc[0].command).toBe('cmdA')
    expect(ipc[0].callCount).toBe(2)
    expect(ipc[0].averageDuration).toBeCloseTo(200)
    expect(ipc.find(m => m.command === 'cmdB')!.callCount).toBe(1)
  })

  it('reset clears metrics', () => {
    trackIpcCall('x', 1)
    expect(getIpcMetrics().length).toBeGreaterThan(0)
    resetIpcMetrics()
    expect(getIpcMetrics().length).toBe(0)

    // render metrics are empty initially
    expect(getRenderMetrics().length).toBe(0)
  })

  it('logPerformanceSummary runs for empty and non-empty metrics', () => {
    const consoleGroup = console.group
    const consoleLog = console.log
    const consoleTable = console.table
    const consoleGroupEnd = console.groupEnd
    console.group = () => {}
    console.log = () => {}
    console.table = () => {}
    console.groupEnd = () => {}

    // empty - should not throw
    expect(() => logPerformanceSummary()).not.toThrow()

    // add some ipc metrics and ensure no throw and metrics recorded
    trackIpcCall('x', 10)
    expect(getIpcMetrics().length).toBeGreaterThan(0)
    expect(() => logPerformanceSummary()).not.toThrow()

    // restore
    console.group = consoleGroup
    console.log = consoleLog
    console.table = consoleTable
    console.groupEnd = consoleGroupEnd
  })
})
