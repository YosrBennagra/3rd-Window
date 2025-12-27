import { describe, it, expect } from 'vitest'
import type { SystemTemperatures, Monitor, AppSettings } from './system'

describe('system types', () => {
  it('creates valid SystemTemperatures', () => {
    const temps: SystemTemperatures = {
      cpu_temp: 55.5,
      gpu_temp: 62.3,
      cpu_usage: 45.2,
      available_sensors: ['cpu', 'gpu', 'motherboard'],
    }

    expect(temps.cpu_temp).toBe(55.5)
    expect(temps.available_sensors).toHaveLength(3)
  })

  it('allows null temperatures when unavailable', () => {
    const temps: SystemTemperatures = {
      cpu_temp: null,
      gpu_temp: null,
      cpu_usage: 10,
      available_sensors: [],
    }

    expect(temps.cpu_temp).toBeNull()
    expect(temps.gpu_temp).toBeNull()
  })

  it('creates valid Monitor config', () => {
    const monitor: Monitor = {
      identifier: 'DISPLAY1',
      name: 'Primary Monitor',
      size: { width: 1920, height: 1080 },
      position: { x: 0, y: 0 },
      is_primary: true,
      scale_factor: 1.0,
      refresh_rate: 60,
    }

    expect(monitor.is_primary).toBe(true)
    expect(monitor.size.width).toBe(1920)
    expect(monitor.refresh_rate).toBe(60)
  })

  it('allows optional monitor fields', () => {
    const monitor: Monitor = {
      name: 'Secondary',
      size: { width: 2560, height: 1440 },
      position: { x: 1920, y: 0 },
      is_primary: false,
    }

    expect(monitor.identifier).toBeUndefined()
    expect(monitor.scale_factor).toBeUndefined()
    expect(monitor.refresh_rate).toBeUndefined()
  })

  it('creates valid AppSettings', () => {
    const settings: AppSettings = {
      isFullscreen: false,
      selectedMonitor: 0,
    }

    expect(settings.isFullscreen).toBe(false)
    expect(settings.selectedMonitor).toBe(0)
  })
})
