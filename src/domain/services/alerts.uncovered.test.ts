import { describe, it, expect } from 'vitest'
import { evaluateAlerts, createDefaultAlertRules } from './alerts'

describe('alerts evaluator (focused)', () => {
  it('triggers alerts for gt, lt and eq and handles GPU metric', () => {
    const metrics = { cpuUsage: 50, cpuTempC: 60, gpuTempC: 70 }
    const ts = 1600000000000

    const rules = [
      { id: 'r1', enabled: true, metric: 'GPU Temp', operator: 'gt', threshold: 65, severity: 'critical' },
      { id: 'r2', enabled: true, metric: 'CPU Usage', operator: 'eq', threshold: 50, severity: 'warning' },
      { id: 'r3', enabled: true, metric: 'CPU Temperature', operator: 'lt', threshold: 70, severity: 'info' },
    ]

    const alerts = evaluateAlerts(metrics as any, rules as any, ts)
    // all three rules should produce alerts
    expect(alerts.length).toBe(3)
    expect(alerts.map(a => a.id).join(' ')).toContain('r1')
    expect(alerts.map(a => a.id).join(' ')).toContain('r2')
    expect(alerts.map(a => a.id).join(' ')).toContain('r3')
  })

  it('ignores disabled rules and unknown metrics', () => {
    const metrics = { cpuUsage: 10, cpuTempC: 30, gpuTempC: 20 }
    const ts = 1600000000000

    const rules = [
      { id: 'disabled', enabled: false, metric: 'CPU Usage', operator: 'gt', threshold: 1, severity: 'info' },
      { id: 'unknown', enabled: true, metric: 'Memory Usage', operator: 'gt', threshold: 1, severity: 'warning' },
    ]

    const alerts = evaluateAlerts(metrics as any, rules as any, ts)
    expect(alerts.length).toBe(0)
  })

  it('createDefaultAlertRules returns sane defaults', () => {
    const defaults = createDefaultAlertRules()
    expect(Array.isArray(defaults)).toBe(true)
    expect(defaults.length).toBeGreaterThanOrEqual(1)
  })

  it('does not trigger on unknown operator (default branch)', () => {
    const metrics = { cpuUsage: 10, cpuTempC: 30, gpuTempC: 20 }
    const ts = 1600000000000
    const rules = [
      { id: 'badop', enabled: true, metric: 'CPU Usage', operator: 'noop' } as any,
    ]
    const alerts = evaluateAlerts(metrics as any, rules as any, ts)
    expect(alerts.length).toBe(0)
  })
})
