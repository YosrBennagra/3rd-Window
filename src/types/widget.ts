import type { WidgetLayout } from './layout';

export interface WidgetProps {
  widget: WidgetLayout;
}

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType<{ widget: WidgetLayout }>;
  defaultSize?: 'small' | 'medium' | 'large';
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

export interface WidgetInstance {
  id: string;
  widgetId: string;
  position: { x: number; y: number };
  size?: 'small' | 'medium' | 'large';
  settings?: Record<string, unknown>;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuProps {
  position: ContextMenuPosition | null;
  title: string;
  onClose: () => void;
  onProperties?: () => void;
  onRemove?: () => void;
}
