import type { ComponentType } from 'react';
import type { WidgetLayout } from '../domain/models/layout';
import type { WidgetComponentProps } from '../domain/contracts/WidgetContract';
import { 
  ClockWidget, 
  TimerWidget, 
  ActivityWidget, 
  ImageWidget, 
  VideoWidget, 
  NotesWidget, 
  QuickLinksWidget, 
  NetworkMonitorWidget, 
  TemperatureWidget, 
  RamUsageWidget, 
  DiskUsageWidget, 
  PDFWidget 
} from '../ui/components/widgets/desktop';

/**
 * Widget Component Registry (SOLID: Open/Closed Principle)
 * 
 * This registry allows adding new widgets without modifying existing code.
 * To add a new widget:
 * 1. Import the widget component
 * 2. Register it here
 * 3. Add constraints to domain/config/widgetConstraints.ts
 * 
 * NOTE: The WidgetComponent type is a union to support both legacy widgets
 * (using { widget: WidgetLayout }) and new contract-compliant widgets
 * (using WidgetComponentProps). Gradually migrate widgets to the new API.
 */

type WidgetComponent = ComponentType<WidgetComponentProps> | ComponentType<{ widget: WidgetLayout }>;

class WidgetRegistry {
  private components = new Map<string, WidgetComponent>();

  register(type: string, component: WidgetComponent): void {
    if (this.components.has(type)) {
      console.warn(`[WidgetRegistry] Overwriting widget: ${type}`);
    }
    this.components.set(type, component);
  }

  get(type: string): WidgetComponent | undefined {
    return this.components.get(type);
  }

  has(type: string): boolean {
    return this.components.has(type);
  }

  getAllTypes(): string[] {
    return Array.from(this.components.keys());
  }

  getComponents(): Record<string, WidgetComponent> {
    return Object.fromEntries(this.components.entries());
  }
}

// Singleton registry instance
const registry = new WidgetRegistry();

// Register all available widgets (Open/Closed: add new widgets here)
registry.register('clock', ClockWidget as WidgetComponent);
registry.register('timer', TimerWidget as WidgetComponent);
registry.register('activity', ActivityWidget as WidgetComponent);
registry.register('image', ImageWidget as WidgetComponent);
registry.register('video', VideoWidget as WidgetComponent);
registry.register('notes', NotesWidget as WidgetComponent);
registry.register('quicklinks', QuickLinksWidget as WidgetComponent);
registry.register('network-monitor', NetworkMonitorWidget as WidgetComponent);
registry.register('temperature', TemperatureWidget as WidgetComponent);
registry.register('ram', RamUsageWidget as WidgetComponent);
registry.register('disk', DiskUsageWidget as WidgetComponent);
registry.register('pdf', PDFWidget as WidgetComponent);

export { registry as widgetRegistry };
export type { WidgetComponent };
