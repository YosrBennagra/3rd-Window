import { beforeEach, describe, expect, it } from 'vitest';
import { useGridStore, DEFAULT_GRID } from './gridStore';
import {
  CLOCK_WIDGET_DEFAULT_SETTINGS,
  QUICKLINKS_WIDGET_DEFAULT_SETTINGS,
} from '@domain/models/widgets';
import { QUICKLINKS_CONSTRAINTS } from '@domain/config/widgetConstraints';

const resetStore = () => {
  useGridStore.setState({
    grid: DEFAULT_GRID,
    widgets: [],
    debugGrid: false,
    isLoaded: false,
  });
};

describe('useGridStore behaviour', () => {
  beforeEach(() => {
    resetStore();
  });

  it('clamps add operations to grid bounds and applies widget defaults', async () => {
    const success = await useGridStore
      .getState()
      .applyOperation({
        type: 'addWidget',
        widgetType: 'quicklinks',
        layout: {
          x: 99,
          y: 99,
          width: 10,
          height: 10,
          locked: true,
        },
      });

    expect(success).toBe(true);
    const widget = useGridStore.getState().widgets[0];
    expect(widget).toBeDefined();
    expect(widget.widgetType).toBe('quicklinks');
    expect(widget.width).toBe(QUICKLINKS_CONSTRAINTS.maxWidth);
    expect(widget.height).toBe(QUICKLINKS_CONSTRAINTS.maxHeight);
    expect(widget.x).toBe(DEFAULT_GRID.columns - widget.width);
    expect(widget.y).toBe(DEFAULT_GRID.rows - widget.height);
    expect(widget.locked).toBe(true);
    expect(widget.settings).toEqual(QUICKLINKS_WIDGET_DEFAULT_SETTINGS);
  });

  it('rejects overlapping add operations', async () => {
    const addFirst = await useGridStore
      .getState()
      .applyOperation({
        type: 'addWidget',
        widgetType: 'clock',
        layout: { x: 0, y: 0, width: 3, height: 2 },
      });
    expect(addFirst).toBe(true);

    const addSecond = await useGridStore
      .getState()
      .applyOperation({
        type: 'addWidget',
        widgetType: 'clock',
        layout: { x: 0, y: 0, width: 3, height: 2 },
      });

    expect(addSecond).toBe(false);
    expect(useGridStore.getState().widgets).toHaveLength(1);
  });

  it('respects widget locking and normalizes clock settings updates', async () => {
    const added = await useGridStore
      .getState()
      .applyOperation({
        type: 'addWidget',
        widgetType: 'clock',
        layout: { x: 0, y: 0, width: 3, height: 2 },
      });
    expect(added).toBe(true);

    const widgetId = useGridStore.getState().widgets[0]?.id as string;
    await useGridStore.getState().setWidgetLock(widgetId, true);

    const moved = await useGridStore
      .getState()
      .moveWidget(widgetId, { x: 5, y: 5 });
    expect(moved).toBe(false);
    expect(useGridStore.getState().widgets[0]?.x).toBe(0);
    expect(useGridStore.getState().widgets[0]?.y).toBe(0);

    await useGridStore.getState().setWidgetLock(widgetId, false);

    const updated = await useGridStore
      .getState()
      .updateWidgetSettings(widgetId, {
        timeFormat: 'invalid-value',
        showSeconds: false,
        minGridSize: { width: 1, height: 1 },
      });

    expect(updated).toBe(true);
    type ClockSettingsShape = {
      timeFormat: string;
      showSeconds: boolean;
      minGridSize: { width: number; height: number };
    };
    const settings = useGridStore.getState().widgets[0]
      ?.settings as ClockSettingsShape;
    expect(settings).toBeDefined();
    expect(settings.timeFormat).toBe(CLOCK_WIDGET_DEFAULT_SETTINGS.timeFormat);
    expect(settings.showSeconds).toBe(false);
    expect(settings.minGridSize).toEqual({
      width: 3,
      height: 2,
    });
  });
});
