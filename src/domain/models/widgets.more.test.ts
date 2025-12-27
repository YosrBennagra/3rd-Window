import { describe, it, expect } from 'vitest'
import {
  ensureTimerWidgetSettings,
  TIMER_WIDGET_DEFAULT_SETTINGS,
  ensureNotesWidgetSettings,
  NOTES_WIDGET_DEFAULT_SETTINGS,
  ensureQuickLinksWidgetSettings,
  QUICKLINKS_WIDGET_DEFAULT_SETTINGS,
} from './widgets'

describe('widgets additional validators', () => {
  it('ensureTimerWidgetSettings validates types and defaults', () => {
    expect(ensureTimerWidgetSettings(undefined)).toEqual(TIMER_WIDGET_DEFAULT_SETTINGS)

    const bad = ensureTimerWidgetSettings({ durationMinutes: 'x', showLabel: 'no' } as any)
    expect(bad.durationMinutes).toBe(TIMER_WIDGET_DEFAULT_SETTINGS.durationMinutes)
    expect(bad.showLabel).toBe(TIMER_WIDGET_DEFAULT_SETTINGS.showLabel)

    const ok = ensureTimerWidgetSettings({ durationMinutes: 5, durationSeconds: 30, label: 'T', showLabel: false })
    expect(ok.durationMinutes).toBe(5)
    expect(ok.durationSeconds).toBe(30)
    expect(ok.label).toBe('T')
    expect(ok.showLabel).toBe(false)
  })

  it('ensureNotesWidgetSettings filters todos and enforces font size', () => {
    expect(ensureNotesWidgetSettings(undefined)).toEqual(NOTES_WIDGET_DEFAULT_SETTINGS)

    const mixedTodos = [
      { id: '1', text: 'a', completed: false },
      { id: 'bad' },
      null,
    ]

    const res = ensureNotesWidgetSettings({ todos: mixedTodos, fontSize: -1, mode: 'todos' } as any)
    expect(res.todos.length).toBe(1)
    expect(res.fontSize).toBe(NOTES_WIDGET_DEFAULT_SETTINGS.fontSize)
    expect(res.mode).toBe('todos')

    const ok = ensureNotesWidgetSettings({ fontSize: 18, noteText: 'hi' })
    expect(ok.fontSize).toBe(18)
    expect(ok.noteText).toBe('hi')
  })

  it('ensureQuickLinksWidgetSettings filters links and validates gridColumns bounds', () => {
    expect(ensureQuickLinksWidgetSettings(undefined)).toEqual(QUICKLINKS_WIDGET_DEFAULT_SETTINGS)

    const mixed = [
      { id: 'l1', title: 'One', url: 'https://one' },
      { id: 'bad', title: 123 },
    ]

    const res = ensureQuickLinksWidgetSettings({ links: mixed, gridColumns: 10 } as any)
    expect(res.links.length).toBe(1)
    expect(res.gridColumns).toBe(QUICKLINKS_WIDGET_DEFAULT_SETTINGS.gridColumns)

    const ok = ensureQuickLinksWidgetSettings({ gridColumns: 3 })
    expect(ok.gridColumns).toBe(3)
  })
})
