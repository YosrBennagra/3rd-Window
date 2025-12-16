import { create } from 'zustand';

export interface GridPosition {
  col: number; // 0-5 (6 columns)
  row: number; // 0-5 (6 rows)
  width: number; // span in columns (1-6)
  height: number; // span in rows (1-6)
}

export interface WidgetGridItem {
  id: string;
  widgetType: string;
  position: GridPosition;
}

interface GridState {
  widgets: WidgetGridItem[];
  addWidget: (widgetType: string, position: GridPosition) => void;
  updateWidgetPosition: (id: string, position: GridPosition) => void;
  removeWidget: (id: string) => void;
  isPositionOccupied: (position: GridPosition, excludeId?: string) => boolean;
}

export const useGridStore = create<GridState>((set, get) => ({
  widgets: [
    {
      id: 'clock-1',
      widgetType: 'clock',
      position: { col: 0, row: 0, width: 1, height: 1 }
    },
    {
      id: 'cpu-temp-1',
      widgetType: 'cpu-temp',
      position: { col: 1, row: 0, width: 1, height: 1 }
    },
    {
      id: 'gpu-temp-1',
      widgetType: 'gpu-temp',
      position: { col: 2, row: 0, width: 1, height: 1 }
    }
  ],

  addWidget: (widgetType, position) => {
    const id = `${widgetType}-${Date.now()}`;
    set(state => ({
      widgets: [...state.widgets, { id, widgetType, position }]
    }));
  },

  updateWidgetPosition: (id, position) => {
    set(state => ({
      widgets: state.widgets.map(w => 
        w.id === id ? { ...w, position } : w
      )
    }));
  },

  removeWidget: (id) => {
    set(state => ({
      widgets: state.widgets.filter(w => w.id !== id)
    }));
  },

  isPositionOccupied: (position, excludeId) => {
    const widgets = get().widgets.filter(w => w.id !== excludeId);
    
    return widgets.some(widget => {
      const w = widget.position;
      // Check if rectangles overlap
      return !(
        position.col >= w.col + w.width ||
        position.col + position.width <= w.col ||
        position.row >= w.row + w.height ||
        position.row + position.height <= w.row
      );
    });
  },
}));
