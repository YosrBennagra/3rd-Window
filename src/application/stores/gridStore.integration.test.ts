/**
 * Integration Tests: Grid Store Workflows
 * 
 * Tests complex state management workflows and widget coordination.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestStore } from '../../test/mocks/zustand';
import { createMockWidget } from '../../test/utils/test-helpers';
import type { WidgetLayout } from '../../domain/models/layout';

// Import the actual store creator (adjust path as needed)
// For now, we'll create a simplified test version

interface GridState {
  widgets: WidgetLayout[];
  addWidget: (widget: WidgetLayout) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetLayout>) => void;
}

describe('Grid Store Integration', () => {
  let store: ReturnType<typeof createTestStore<GridState>>;

  beforeEach(() => {
    store = createTestStore<GridState>((set) => ({
      widgets: [],
      addWidget: (widget) => set((state) => ({ widgets: [...state.widgets, widget] })),
      removeWidget: (id) => set((state) => ({ widgets: state.widgets.filter((w) => w.id !== id) })),
      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
    }));
  });

  it('adds widget to empty grid', () => {
    const widget = createMockWidget();
    store.getState().addWidget(widget);
    
    expect(store.getState().widgets).toHaveLength(1);
    expect(store.getState().widgets[0]).toEqual(widget);
  });

  it('adds multiple widgets', () => {
    const widget1 = createMockWidget({ id: 'widget-1' });
    const widget2 = createMockWidget({ id: 'widget-2', x: 4 });
    
    store.getState().addWidget(widget1);
    store.getState().addWidget(widget2);
    
    expect(store.getState().widgets).toHaveLength(2);
    expect(store.getState().widgets.map((w) => w.id)).toEqual(['widget-1', 'widget-2']);
  });

  it('removes widget by ID', () => {
    const widget1 = createMockWidget({ id: 'widget-1' });
    const widget2 = createMockWidget({ id: 'widget-2' });
    
    store.getState().addWidget(widget1);
    store.getState().addWidget(widget2);
    store.getState().removeWidget('widget-1');
    
    expect(store.getState().widgets).toHaveLength(1);
    expect(store.getState().widgets[0].id).toBe('widget-2');
  });

  it('updates widget properties', () => {
    const widget = createMockWidget({ id: 'widget-1', x: 0, y: 0 });
    
    store.getState().addWidget(widget);
    store.getState().updateWidget('widget-1', { x: 5, y: 3 });
    
    const updated = store.getState().widgets[0];
    expect(updated.x).toBe(5);
    expect(updated.y).toBe(3);
  });

  it('preserves other widget properties when updating', () => {
    const widget = createMockWidget({
      id: 'widget-1',
      widgetType: 'clock',
      x: 0,
      y: 0,
      width: 4,
      height: 3,
    });
    
    store.getState().addWidget(widget);
    store.getState().updateWidget('widget-1', { x: 2 });
    
    const updated = store.getState().widgets[0];
    expect(updated.widgetType).toBe('clock');
    expect(updated.width).toBe(4);
    expect(updated.height).toBe(3);
    expect(updated.x).toBe(2);
  });

  it('tracks action history', () => {
    store.clearActions();
    
    const widget = createMockWidget();
    store.getState().addWidget(widget);
    store.getState().updateWidget(widget.id, { x: 5 });
    
    expect(store.actions.length).toBeGreaterThan(0);
  });
});
