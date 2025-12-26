import { describe, it, expect, beforeEach } from 'vitest'
import { ContractBasedWidgetRegistry } from './ContractWidgetRegistry'
import type { WidgetContract } from '../contracts/WidgetContract'

const createTestContract = (id: string, overrides: Partial<WidgetContract> = {}): WidgetContract => ({
  id,
  displayName: `Test ${id}`,
  description: 'Test widget',
  category: 'utility',
  version: '1.0.0',
  sizeConstraints: {
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 4,
    defaultWidth: 3,
    defaultHeight: 3,
    resizable: true,
  },
  supportedModes: ['dashboard', 'desktop'],
  component: (() => null) as any,
  settingsSchema: {},
  enabled: true,
  persistence: {
    persistedFields: ['title'],
    runtimeFields: [],
    version: 1,
  },
  defaultSettings: {},
  ...overrides,
})

describe('ContractWidgetRegistry', () => {
  let registry: ContractBasedWidgetRegistry

  beforeEach(() => {
    registry = new ContractBasedWidgetRegistry()
  })

  it('registers a valid widget contract', () => {
    const contract = createTestContract('widget1')
    const result = registry.register(contract)

    expect(result.success).toBe(true)
    expect(result.widgetId).toBe('widget1')
    expect(registry.has('widget1')).toBe(true)
  })

  it('prevents duplicate registration without allowOverwrite', () => {
    const contract = createTestContract('widget1')
    registry.register(contract)
    const result = registry.register(contract)

    expect(result.success).toBe(false)
    expect(result.error).toContain('already registered')
  })

  it('allows overwrite when specified', () => {
    const contract1 = createTestContract('widget1', { displayName: 'V1' })
    const contract2 = createTestContract('widget1', { displayName: 'V2' })

    registry.register(contract1)
    const result = registry.register(contract2, { allowOverwrite: true })

    expect(result.success).toBe(true)
    expect(registry.get('widget1')?.displayName).toBe('V2')
  })

  it('unregisters widgets', () => {
    const contract = createTestContract('widget1')
    registry.register(contract)
    const removed = registry.unregister('widget1')

    expect(removed).toBe(true)
    expect(registry.has('widget1')).toBe(false)
  })

  it('returns all widget IDs', () => {
    registry.register(createTestContract('w1'))
    registry.register(createTestContract('w2'))
    registry.register(createTestContract('w3'))

    const ids = registry.getAllIds()
    expect(ids).toHaveLength(3)
    expect(ids).toContain('w1')
    expect(ids).toContain('w2')
    expect(ids).toContain('w3')
  })

  it('gets widgets in registration order', () => {
    registry.register(createTestContract('w1'))
    registry.register(createTestContract('w2'))
    registry.register(createTestContract('w3'))

    const ordered = registry.getInRegistrationOrder()
    expect(ordered.map(c => c.id)).toEqual(['w1', 'w2', 'w3'])
  })

  it('queries widgets by category', () => {
    registry.register(createTestContract('sys1', { category: 'system' }))
    registry.register(createTestContract('util1', { category: 'utility' }))
    registry.register(createTestContract('sys2', { category: 'system' }))

    const systemWidgets = registry.query({ category: 'system' })
    expect(systemWidgets).toHaveLength(2)
    expect(systemWidgets.every(w => w.category === 'system')).toBe(true)
  })

  it('queries widgets by mode', () => {
    registry.register(createTestContract('dash', { supportedModes: ['dashboard'] }))
    registry.register(createTestContract('desk', { supportedModes: ['desktop'] }))
    registry.register(createTestContract('both', { supportedModes: ['both'] }))

    const dashboardWidgets = registry.query({ mode: 'dashboard' })
    expect(dashboardWidgets.length).toBeGreaterThanOrEqual(2)
  })

  it('queries widgets by enabled status', () => {
    registry.register(createTestContract('enabled', { enabled: true }))
    registry.register(createTestContract('disabled', { enabled: false }))

    const enabledWidgets = registry.query({ enabled: true })
    const disabledWidgets = registry.query({ enabled: false })

    expect(enabledWidgets.some(w => w.id === 'enabled')).toBe(true)
    expect(disabledWidgets.some(w => w.id === 'disabled')).toBe(true)
  })

  it('bulk registers multiple widgets', () => {
    const contracts = [
      createTestContract('w1'),
      createTestContract('w2'),
      createTestContract('w3'),
    ]

    const results = registry.registerMany(contracts)

    expect(results).toHaveLength(3)
    expect(results.every(r => r.success)).toBe(true)
    expect(registry.getAllIds()).toHaveLength(3)
  })

  it('returns registry stats', () => {
    registry.register(createTestContract('e1', { enabled: true }))
    registry.register(createTestContract('e2', { enabled: true }))
    registry.register(createTestContract('d1', { enabled: false }))

    const stats = registry.getStats()
    expect(stats.totalWidgets).toBe(3)
    expect(stats.enabledWidgets).toBe(2)
    expect(stats.disabledWidgets).toBe(1)
  })

  it('clears all widgets', () => {
    registry.register(createTestContract('w1'))
    registry.register(createTestContract('w2'))

    registry.clear()

    expect(registry.getAllIds()).toHaveLength(0)
  })

  it('queries widgets by resizable constraint', () => {
    registry.register(createTestContract('resizable', {
      sizeConstraints: { ...createTestContract('test').sizeConstraints, resizable: true }
    }))
    registry.register(createTestContract('fixed', {
      sizeConstraints: { ...createTestContract('test').sizeConstraints, resizable: false }
    }))

    const resizableWidgets = registry.query({ resizable: true })
    const fixedWidgets = registry.query({ resizable: false })

    expect(resizableWidgets.some(w => w.id === 'resizable')).toBe(true)
    expect(fixedWidgets.some(w => w.id === 'fixed')).toBe(true)
  })

  it('gets widgets by category using shortcut method', () => {
    registry.register(createTestContract('sys1', { category: 'system' }))
    registry.register(createTestContract('util1', { category: 'utility' }))

    const systemWidgets = registry.getByCategory('system')

    expect(systemWidgets).toHaveLength(1)
    expect(systemWidgets[0].id).toBe('sys1')
  })

  it('gets widgets by mode using shortcut method', () => {
    registry.register(createTestContract('dash', { supportedModes: ['dashboard'] }))

    const dashboardWidgets = registry.getByMode('dashboard')

    expect(dashboardWidgets.length).toBeGreaterThan(0)
  })

  it('gets enabled widgets using shortcut method', () => {
    registry.register(createTestContract('enabled', { enabled: true }))
    registry.register(createTestContract('disabled', { enabled: false }))

    const enabledWidgets = registry.getEnabled()

    expect(enabledWidgets.every(w => w.enabled !== false)).toBe(true)
  })

  it('retrieves validation for a widget', () => {
    registry.register(createTestContract('test'))

    const validation = registry.getValidation('test')

    expect(validation).toBeDefined()
    expect(validation?.valid).toBe(true)
  })

  it('gets all categories', () => {
    registry.register(createTestContract('w1', { category: 'system' }))
    registry.register(createTestContract('w2', { category: 'utility' }))
    registry.register(createTestContract('w3', { category: 'system' }))

    const categories = registry.getCategories()

    expect(categories).toContain('system')
    expect(categories).toContain('utility')
    expect(categories).toHaveLength(2)
    expect(categories[0] < categories[1]).toBe(true) // sorted
  })

  it('validates all registered widgets', () => {
    registry.register(createTestContract('w1'))
    registry.register(createTestContract('w2'))

    const validations = registry.validateAll()

    expect(validations.size).toBe(2)
    expect(validations.get('w1')?.valid).toBe(true)
    expect(validations.get('w2')?.valid).toBe(true)
  })

  it('gets contracts with warnings', () => {
    const contractWithWarning = createTestContract('warned', {
      version: undefined, // This should trigger a warning
    })
    registry.register(contractWithWarning)

    const warned = registry.getContractsWithWarnings()

    expect(warned.some(w => w.contract.id === 'warned')).toBe(true)
  })

  it('exports registry as JSON', () => {
    registry.register(createTestContract('w1'))
    registry.register(createTestContract('w2'))

    const exported = registry.export()

    expect(exported['w1']).toBeDefined()
    expect(exported['w2']).toBeDefined()
    expect(Object.keys(exported)).toHaveLength(2)
  })

  it('prints status without errors', () => {
    registry.register(createTestContract('test'))

    expect(() => registry.printStatus()).not.toThrow()
  })

  it('gets all contracts', () => {
    registry.register(createTestContract('w1'))
    registry.register(createTestContract('w2'))

    const all = registry.getAll()

    expect(all).toHaveLength(2)
    expect(all.some(c => c.id === 'w1')).toBe(true)
    expect(all.some(c => c.id === 'w2')).toBe(true)
  })

  it('gets specific contract', () => {
    const contract = createTestContract('test')
    registry.register(contract)

    const retrieved = registry.get('test')

    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe('test')
  })

  it('checks if widget is registered', () => {
    registry.register(createTestContract('exists'))

    expect(registry.has('exists')).toBe(true)
    expect(registry.has('does-not-exist')).toBe(false)
  })

  it('skips validation when skipValidation option is true', () => {
    const invalidContract = {
      id: 'invalid',
      // Missing required fields
    } as any

    const result = registry.register(invalidContract, { skipValidation: true })

    expect(result.success).toBe(true)
    expect(registry.has('invalid')).toBe(true)
  })

  it('logs info when successfully registering', () => {
    const contract = createTestContract('logged')
    
    // Should not throw and should register successfully
    const result = registry.register(contract)
    
    expect(result.success).toBe(true)
    expect(registry.has('logged')).toBe(true)
  })

  it('returns undefined for non-existent widget', () => {
    const retrieved = registry.get('does-not-exist')
    
    expect(retrieved).toBeUndefined()
  })

  it('returns undefined validation for non-existent widget', () => {
    const validation = registry.getValidation('does-not-exist')
    
    expect(validation).toBeUndefined()
  })

  it('skips validation when skipValidation option is true', () => {
    const invalidContract = {
      id: 'invalid',
      // Missing required fields intentionally for skipValidation test
    } as any

    const result = registry.register(invalidContract, { skipValidation: true })

    expect(result.success).toBe(true)
    expect(registry.has('invalid')).toBe(true)
  })

  it('returns false when unregistering non-existent widget', () => {
    const removed = registry.unregister('does-not-exist')
    
    expect(removed).toBe(false)
  })
})
