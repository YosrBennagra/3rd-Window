import { describe, it, expect, vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/window', () => {
  const setPosition = vi.fn()
  return {
    getCurrentWindow: () => ({ outerPosition: async () => ({ x: 10, y: 20 }), setPosition }),
    PhysicalPosition: class { constructor(public x: number, public y: number) {} },
  }
})

import { setAlwaysOnTop, setFullscreen, getWindowPosition, setWindowPosition } from './windowService'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window'

describe('windowService', () => {
  it('setAlwaysOnTop calls invoke', async () => {
    await setAlwaysOnTop(true)
    expect(invoke).toHaveBeenCalledWith('set_always_on_top', { enabled: true })
  })

  it('setFullscreen calls invoke', async () => {
    await setFullscreen(false)
    expect(invoke).toHaveBeenCalledWith('set_fullscreen', { fullscreen: false })
  })

  it('getWindowPosition returns coordinates', async () => {
    const pos = await getWindowPosition()
    expect(pos).toEqual({ x: 10, y: 20 })
  })

  it('setWindowPosition calls setPosition with PhysicalPosition', async () => {
    const window = getCurrentWindow()
    const spy = vi.spyOn(window, 'setPosition')
    await setWindowPosition(5, 6)
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toBeInstanceOf(PhysicalPosition)
  })
})
