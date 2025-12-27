import { describe, it, expect } from 'vitest'
import { validateWidgetContract, isWidgetContract } from './WidgetContract'
import type { WidgetContract } from './WidgetContract'

describe('validateWidgetContract', () => {
  const baseValidContract: WidgetContract = {
    id: 'test-widget',
    displayName: 'Test Widget',
    description: 'Test description',
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
    supportedModes: ['dashboard'],
    component: (() => null) as any,
    settingsSchema: {},
    enabled: true,
    persistence: {
      persistedFields: ['title'],
      runtimeFields: [],
      version: 1,
    },
    defaultSettings: {},
  }

  it('validates a complete valid contract', () => {
    const result = validateWidgetContract(baseValidContract)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects contract without id', () => {
    const contract = { ...baseValidContract, id: '' }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget must have a valid string ID')
  })

  it('rejects non-kebab-case id', () => {
    const contract = { ...baseValidContract, id: 'TestWidget' }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('kebab-case'))).toBe(true)
  })

  it('rejects contract without displayName', () => {
    const contract = { ...baseValidContract, displayName: '' }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget must have a displayName')
  })

  it('rejects contract without category', () => {
    const contract = { ...baseValidContract, category: undefined }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget must have a category')
  })

  it('rejects contract without description', () => {
    const contract = { ...baseValidContract, description: undefined }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget must have a description')
  })

  it('rejects contract without supportedModes', () => {
    const contract = { ...baseValidContract, supportedModes: [] }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget must declare at least one supported mode')
  })

  it('warns about missing version', () => {
    const contract = { ...baseValidContract, version: undefined }
    const result = validateWidgetContract(contract as any)
    
    expect(result.warnings.some(w => w.includes('version'))).toBe(true)
  })

  it('rejects contract without sizeConstraints', () => {
    const contract = { ...baseValidContract, sizeConstraints: undefined }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget must define sizeConstraints')
  })

  it('rejects sizeConstraints with minWidth < 1', () => {
    const contract = {
      ...baseValidContract,
      sizeConstraints: { ...baseValidContract.sizeConstraints, minWidth: 0 }
    }
    const result = validateWidgetContract(contract)
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('minWidth and minHeight must be at least 1'))).toBe(true)
  })

  it('rejects sizeConstraints with maxWidth < minWidth', () => {
    const contract = {
      ...baseValidContract,
      sizeConstraints: { ...baseValidContract.sizeConstraints, maxWidth: 1, minWidth: 2 }
    }
    const result = validateWidgetContract(contract)
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('maxWidth/maxHeight must be >='))).toBe(true)
  })

  it('rejects sizeConstraints with defaultWidth out of range', () => {
    const contract = {
      ...baseValidContract,
      sizeConstraints: { ...baseValidContract.sizeConstraints, defaultWidth: 10, maxWidth: 4 }
    }
    const result = validateWidgetContract(contract)
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('defaultWidth must be between'))).toBe(true)
  })

  it('rejects sizeConstraints with defaultHeight out of range', () => {
    const contract = {
      ...baseValidContract,
      sizeConstraints: { ...baseValidContract.sizeConstraints, defaultHeight: 1, minHeight: 2 }
    }
    const result = validateWidgetContract(contract)
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('defaultHeight must be between'))).toBe(true)
  })

  it('rejects contract without persistence', () => {
    const contract = { ...baseValidContract, persistence: undefined }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget must define persistence contract')
  })

  it('rejects persistence without persistedFields array', () => {
    const contract = {
      ...baseValidContract,
      persistence: { ...baseValidContract.persistence, persistedFields: 'not-array' as any }
    }
    const result = validateWidgetContract(contract)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget persistence.persistedFields must be an array')
  })

  it('rejects persistence without runtimeFields array', () => {
    const contract = {
      ...baseValidContract,
      persistence: { ...baseValidContract.persistence, runtimeFields: null as any }
    }
    const result = validateWidgetContract(contract)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget persistence.runtimeFields must be an array')
  })

  it('rejects persistence without numeric version', () => {
    const contract = {
      ...baseValidContract,
      persistence: { ...baseValidContract.persistence, version: '1' as any }
    }
    const result = validateWidgetContract(contract)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget persistence.version must be a number')
  })

  it('rejects contract without defaultSettings', () => {
    const contract = { ...baseValidContract, defaultSettings: undefined }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget must provide defaultSettings')
  })

  it('rejects contract without component', () => {
    const contract = { ...baseValidContract, component: undefined }
    const result = validateWidgetContract(contract as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Widget must provide a component')
  })

  it('warns when onMount exists without onUnmount', () => {
    const contract = {
      ...baseValidContract,
      lifecycle: {
        onMount: () => {},
      }
    }
    const result = validateWidgetContract(contract)
    
    expect(result.warnings.some(w => w.includes('onMount but no onUnmount'))).toBe(true)
  })

  it('does not warn when both onMount and onUnmount exist', () => {
    const contract = {
      ...baseValidContract,
      lifecycle: {
        onMount: () => {},
        onUnmount: () => {},
      }
    }
    const result = validateWidgetContract(contract)
    
    expect(result.warnings.some(w => w.includes('onMount but no onUnmount'))).toBe(false)
  })
})

describe('isWidgetContract', () => {
  it('returns true for valid contract', () => {
    const contract: WidgetContract = {
      id: 'test-widget',
      displayName: 'Test',
      description: 'Test',
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
      supportedModes: ['dashboard'],
      component: (() => null) as any,
      settingsSchema: {},
      enabled: true,
      persistence: {
        persistedFields: [],
        runtimeFields: [],
        version: 1,
      },
      defaultSettings: {},
    }
    
    expect(isWidgetContract(contract)).toBe(true)
  })

  it('returns false for non-object', () => {
    expect(isWidgetContract(null)).toBe(false)
    expect(isWidgetContract(undefined)).toBe(false)
    expect(isWidgetContract('string')).toBe(false)
    expect(isWidgetContract(42)).toBe(false)
  })

  it('returns false for invalid contract', () => {
    const invalid = { id: 'test' }
    expect(isWidgetContract(invalid)).toBe(false)
  })
})
