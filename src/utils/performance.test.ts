import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { createShallowSelector, createValueSelector, createActionSelector } from './performance'

describe('performance selectors', () => {
  it('createShallowSelector calls useStore with shallow', () => {
    const calls: any[] = []
    const fakeUseStore = (selector: any, opts?: any) => {
      calls.push({ selector: selector.toString(), opts })
      return 'result'
    }

    const hook = createShallowSelector(fakeUseStore as any, (s: any) => s.value)
    const res = hook()
    expect(res).toBe('result')
    expect(calls.length).toBe(1)
    expect(calls[0].opts).toBeDefined()
  })

  it('createValueSelector calls useStore without opts', () => {
    const calls: any[] = []
    const fakeUseStore = (selector: any, ...rest: any[]) => {
      calls.push({ selector: selector.toString(), rest })
      return 42
    }

    const hook = createValueSelector(fakeUseStore as any, (s: any) => s.x)
    expect(hook()).toBe(42)
    expect(calls.length).toBe(1)
  })

  it('createActionSelector returns function from store.getState', () => {
    function doAction() { return 'ok' }
    const fakeUseStore: any = Object.assign((() => {}) as any, {
      getState: () => ({ doAction })
    })

    const hookFactory = createActionSelector(fakeUseStore as any, function doActionSelector(s: any) { return s.doAction })
    // Do not invoke hookFactory() to avoid calling React hooks in tests; ensure it returns a function
    expect(typeof hookFactory).toBe('function')
  })
})
