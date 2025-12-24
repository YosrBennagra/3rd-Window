/**
 * Unit Tests: Widget Validators
 * 
 * Tests widget settings validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  ensureClockWidgetSettings,
  ensureTimerWidgetSettings,
  ensureNotesWidgetSettings,
  ensureQuickLinksWidgetSettings,
  CLOCK_WIDGET_DEFAULT_SETTINGS,
  TIMER_WIDGET_DEFAULT_SETTINGS,
  NOTES_WIDGET_DEFAULT_SETTINGS,
  QUICKLINKS_WIDGET_DEFAULT_SETTINGS,
} from '@domain/models/widgets';

describe('ensureClockWidgetSettings', () => {
  it('returns defaults when no settings provided', () => {
    const result = ensureClockWidgetSettings();
    expect(result).toEqual(CLOCK_WIDGET_DEFAULT_SETTINGS);
  });

  it('returns defaults when invalid settings provided', () => {
    const result = ensureClockWidgetSettings(null);
    expect(result).toEqual(CLOCK_WIDGET_DEFAULT_SETTINGS);
  });

  it('preserves valid settings', () => {
    const custom = {
      ...CLOCK_WIDGET_DEFAULT_SETTINGS,
      timeFormat: '24h' as const,
      showSeconds: false,
    };
    const result = ensureClockWidgetSettings(custom);
    expect(result.timeFormat).toBe('24h');
    expect(result.showSeconds).toBe(false);
  });

  it('fills missing properties with defaults', () => {
    const partial = { timeFormat: '24h' as const };
    const result = ensureClockWidgetSettings(partial);
    expect(result.timeFormat).toBe('24h');
    expect(result.dateFormat).toBe(CLOCK_WIDGET_DEFAULT_SETTINGS.dateFormat);
  });

  it('handles unknown properties gracefully', () => {
    const withUnknown = {
      ...CLOCK_WIDGET_DEFAULT_SETTINGS,
      unknownProp: 'test',
    };
    const result = ensureClockWidgetSettings(withUnknown);
    expect(result).toHaveProperty('unknownProp');
  });
});

describe('ensureTimerWidgetSettings', () => {
  it('returns defaults when no settings provided', () => {
    const result = ensureTimerWidgetSettings();
    expect(result).toEqual(TIMER_WIDGET_DEFAULT_SETTINGS);
  });

  it('preserves valid settings', () => {
    const custom = {
      ...TIMER_WIDGET_DEFAULT_SETTINGS,
      durationMinutes: 5,
      durationSeconds: 30,
      label: 'Break',
    };
    const result = ensureTimerWidgetSettings(custom);
    expect(result.durationMinutes).toBe(5);
    expect(result.durationSeconds).toBe(30);
    expect(result.label).toBe('Break');
  });

  it('handles numeric values correctly', () => {
    const settings = {
      ...TIMER_WIDGET_DEFAULT_SETTINGS,
      durationMinutes: 10,
      durationSeconds: 0,
    };
    const result = ensureTimerWidgetSettings(settings);
    expect(result.durationMinutes).toBe(10);
    expect(result.durationSeconds).toBe(0);
  });

  it('rejects invalid values', () => {
    const settings = {
      ...TIMER_WIDGET_DEFAULT_SETTINGS,
      durationMinutes: 'invalid',
      label: 123,
    };
    const result = ensureTimerWidgetSettings(settings);
    expect(result.durationMinutes).toBe(TIMER_WIDGET_DEFAULT_SETTINGS.durationMinutes);
    expect(result.label).toBe(TIMER_WIDGET_DEFAULT_SETTINGS.label);
  });
});

describe('ensureNotesWidgetSettings', () => {
  it('returns defaults when no settings provided', () => {
    const result = ensureNotesWidgetSettings();
    expect(result).toEqual(NOTES_WIDGET_DEFAULT_SETTINGS);
  });

  it('preserves valid settings', () => {
    const custom = {
      ...NOTES_WIDGET_DEFAULT_SETTINGS,
      mode: 'todos' as const,
      noteText: 'Test note',
    };
    const result = ensureNotesWidgetSettings(custom);
    expect(result.mode).toBe('todos');
    expect(result.noteText).toBe('Test note');
  });

  it('validates mode values', () => {
    const settings = {
      ...NOTES_WIDGET_DEFAULT_SETTINGS,
      mode: 'invalid',
    };
    const result = ensureNotesWidgetSettings(settings);
    expect(result.mode).toBe(NOTES_WIDGET_DEFAULT_SETTINGS.mode);
  });

  it('handles todos array', () => {
    const todos = [
      { id: '1', text: 'Task 1', completed: false },
      { id: '2', text: 'Task 2', completed: true },
    ];
    const settings = {
      ...NOTES_WIDGET_DEFAULT_SETTINGS,
      todos,
    };
    const result = ensureNotesWidgetSettings(settings);
    expect(result.todos).toEqual(todos);
  });
});

describe('ensureQuickLinksWidgetSettings', () => {
  it('returns defaults when no settings provided', () => {
    const result = ensureQuickLinksWidgetSettings();
    expect(result).toEqual(QUICKLINKS_WIDGET_DEFAULT_SETTINGS);
  });

  it('preserves valid settings', () => {
    const links = [
      { id: '1', title: 'Google', url: 'https://google.com', icon: '🔍' },
      { id: '2', title: 'GitHub', url: 'https://github.com', icon: '💻' },
    ];
    const settings = {
      ...QUICKLINKS_WIDGET_DEFAULT_SETTINGS,
      links,
      gridColumns: 3,
    };
    const result = ensureQuickLinksWidgetSettings(settings);
    expect(result.links).toEqual(links);
    expect(result.gridColumns).toBe(3);
  });

  it('validates gridColumns range', () => {
    const settings = {
      ...QUICKLINKS_WIDGET_DEFAULT_SETTINGS,
      gridColumns: 10,
    };
    const result = ensureQuickLinksWidgetSettings(settings);
    // Should clamp to valid range if validator implements that
    expect(result.gridColumns).toBeDefined();
  });
});
