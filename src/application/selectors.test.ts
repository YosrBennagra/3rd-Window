import { describe, it, expect, vi } from 'vitest'

// Mock the store before importing selectors
const fakeState = {
  theme: 'dark',
  metrics: { cpu: 1 },
  notifications: [],
  alerts: [],
  shortcuts: [],
  integrations: [],
  pipelines: [],
  notes: [],
  powerSaving: true,
  powerSavingVisible: false,
  togglePowerSaving: () => {},
  settingsOpen: true,
  toggleSettings: () => {},
  closeSettings: () => {},
  refreshAll: () => {},
  lastUpdated: 123,
}

vi.mock('./store', () => ({
  useAppStore: (fn: any) => fn(fakeState)
}))

import * as selectors from './selectors'

describe('application selectors', () => {
  it('returns values from mocked store', () => {
    expect(selectors.useTheme()).toBe('dark')
    expect(selectors.useMetrics()).toEqual({ cpu: 1 })
    expect(selectors.usePowerSaving()).toEqual({ enabled: true, visible: false, toggle: fakeState.togglePowerSaving })
    expect(selectors.useSettingsVisibility()).toEqual({ open: true, toggle: fakeState.toggleSettings, close: fakeState.closeSettings })
    expect(selectors.useLastUpdated()).toBe(123)
  })
})

describe('application selectors - full surface', () => {
  it('calls remaining selectors', () => {
    expect(selectors.useNotifications()).toEqual([])
    expect(selectors.useAlerts()).toEqual([])
    expect(selectors.useShortcuts()).toEqual([])
    expect(selectors.useIntegrations()).toEqual([])
    expect(selectors.usePipelines()).toEqual([])
    expect(selectors.useNotes()).toEqual([])
    expect(selectors.useRefresh()).toBe(fakeState.refreshAll)
  })
})
