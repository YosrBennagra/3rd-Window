/**
 * Widget Lifecycle Manager
 * 
 * Manages widget lifecycle hooks and ensures proper cleanup.
 * Widgets interact with the system only through this manager.
 * 
 * Core Responsibilities:
 * - Execute lifecycle hooks at appropriate times
 * - Track active widget instances
 * - Ensure cleanup happens
 * - Catch and handle widget errors
 */

import type {
  WidgetContract,
  WidgetLifecycleContext,
  WidgetMode,
} from '../../domain/contracts/WidgetContract';

/**
 * Widget instance state tracked by lifecycle manager
 */
interface WidgetInstanceState {
  widgetId: string;
  widgetType: string;
  contract: WidgetContract;
  context: WidgetLifecycleContext;
  mounted: boolean;
  initialized: boolean;
  cleanupFns: Array<() => void | Promise<void>>;
}

/**
 * Lifecycle event for logging/debugging
 */
export interface LifecycleEvent {
  timestamp: number;
  widgetId: string;
  widgetType: string;
  event: 'initialize' | 'mount' | 'resize' | 'settings-change' | 'unmount' | 'error';
  data?: unknown;
}

/**
 * Lifecycle manager configuration
 */
interface LifecycleManagerConfig {
  /** Enable lifecycle event logging */
  enableLogging?: boolean;
  /** Callback for lifecycle events */
  onLifecycleEvent?: (event: LifecycleEvent) => void;
}

/**
 * Widget Lifecycle Manager
 * 
 * Singleton service that manages widget lifecycle hooks.
 */
class WidgetLifecycleManager {
  private instances = new Map<string, WidgetInstanceState>();
  private config: LifecycleManagerConfig;
  private eventHistory: LifecycleEvent[] = [];

  constructor(config: LifecycleManagerConfig = {}) {
    this.config = {
      enableLogging: false,
      ...config,
    };
  }

  /**
   * Configure the lifecycle manager
   */
  configure(config: Partial<LifecycleManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log a lifecycle event
   */
  private logEvent(
    widgetId: string,
    widgetType: string,
    event: LifecycleEvent['event'],
    data?: unknown,
  ): void {
    const lifecycleEvent: LifecycleEvent = {
      timestamp: Date.now(),
      widgetId,
      widgetType,
      event,
      data,
    };

    if (this.config.enableLogging) {
      console.log(`[Lifecycle] ${widgetType}#${widgetId} - ${event}`, data);
    }

    this.eventHistory.push(lifecycleEvent);
    
    // Keep only last 100 events
    if (this.eventHistory.length > 100) {
      this.eventHistory.shift();
    }

    this.config.onLifecycleEvent?.(lifecycleEvent);
  }

  /**
   * Create context for a widget instance
   */
  private createContext(
    widgetId: string,
    widgetType: string,
    settings: Record<string, unknown>,
    size: { width: number; height: number },
    mode: WidgetMode,
  ): WidgetLifecycleContext {
    return {
      widgetId,
      widgetType,
      settings,
      size,
      mode,
    };
  }

  /**
   * Initialize a widget instance
   * Call this when a widget is first created (before mounting)
   */
  async initialize(
    widgetId: string,
    contract: WidgetContract,
    settings: Record<string, unknown>,
    size: { width: number; height: number },
    mode: WidgetMode,
  ): Promise<void> {
    if (this.instances.has(widgetId)) {
      console.warn(`[Lifecycle] Widget ${widgetId} already initialized`);
      return;
    }

    const context = this.createContext(widgetId, contract.id, settings, size, mode);

    const state: WidgetInstanceState = {
      widgetId,
      widgetType: contract.id,
      contract,
      context,
      mounted: false,
      initialized: false,
      cleanupFns: [],
    };

    this.instances.set(widgetId, state);

    try {
      this.logEvent(widgetId, contract.id, 'initialize');
      await contract.lifecycle?.onInitialize?.(context);
      state.initialized = true;
    } catch (error) {
      this.logEvent(widgetId, contract.id, 'error', error);
      await this.handleError(widgetId, error as Error);
      throw error;
    }
  }

  /**
   * Mount a widget instance
   * Call this when widget is mounted to DOM
   */
  async mount(widgetId: string): Promise<void> {
    const state = this.instances.get(widgetId);
    if (!state) {
      console.error(`[Lifecycle] Cannot mount uninitialized widget: ${widgetId}`);
      return;
    }

    if (state.mounted) {
      console.warn(`[Lifecycle] Widget ${widgetId} already mounted`);
      return;
    }

    try {
      this.logEvent(widgetId, state.widgetType, 'mount');
      await state.contract.lifecycle?.onMount?.(state.context);
      state.mounted = true;
    } catch (error) {
      this.logEvent(widgetId, state.widgetType, 'error', error);
      await this.handleError(widgetId, error as Error);
      throw error;
    }
  }

  /**
   * Notify widget of size change
   */
  resize(widgetId: string, newSize: { width: number; height: number }): void {
    const state = this.instances.get(widgetId);
    if (!state) return;

    try {
      this.logEvent(widgetId, state.widgetType, 'resize', newSize);
      state.context.size = newSize;
      state.contract.lifecycle?.onResize?.(state.context, newSize);
    } catch (error) {
      this.logEvent(widgetId, state.widgetType, 'error', error);
      void this.handleError(widgetId, error as Error);
    }
  }

  /**
   * Notify widget of settings change
   */
  updateSettings(widgetId: string, newSettings: Record<string, unknown>): void {
    const state = this.instances.get(widgetId);
    if (!state) return;

    try {
      this.logEvent(widgetId, state.widgetType, 'settings-change', newSettings);
      state.context.settings = newSettings;
      state.contract.lifecycle?.onSettingsChange?.(state.context, newSettings);
    } catch (error) {
      this.logEvent(widgetId, state.widgetType, 'error', error);
      void this.handleError(widgetId, error as Error);
    }
  }

  /**
   * Register a cleanup function for a widget
   * These will be called during unmount
   */
  registerCleanup(widgetId: string, cleanupFn: () => void | Promise<void>): void {
    const state = this.instances.get(widgetId);
    if (!state) {
      console.warn(`[Lifecycle] Cannot register cleanup for unknown widget: ${widgetId}`);
      return;
    }

    state.cleanupFns.push(cleanupFn);
  }

  /**
   * Unmount a widget instance
   * Call this when widget is about to be removed from DOM
   * Ensures ALL cleanup happens
   */
  async unmount(widgetId: string): Promise<void> {
    const state = this.instances.get(widgetId);
    if (!state) {
      console.warn(`[Lifecycle] Cannot unmount unknown widget: ${widgetId}`);
      return;
    }

    if (!state.mounted) {
      console.warn(`[Lifecycle] Widget ${widgetId} not mounted, skipping unmount`);
      return;
    }

    try {
      this.logEvent(widgetId, state.widgetType, 'unmount');

      // Call widget's onUnmount hook
      await state.contract.lifecycle?.onUnmount?.(state.context);

      // Execute all registered cleanup functions
      for (const cleanupFn of state.cleanupFns) {
        try {
          await cleanupFn();
        } catch (error) {
          console.error(`[Lifecycle] Cleanup function failed for ${widgetId}:`, error);
        }
      }

      state.mounted = false;
      state.cleanupFns = [];
      
      // Remove instance from tracking
      this.instances.delete(widgetId);
    } catch (error) {
      this.logEvent(widgetId, state.widgetType, 'error', error);
      console.error(`[Lifecycle] Unmount failed for ${widgetId}:`, error);
      
      // Still remove the instance to prevent leaks
      this.instances.delete(widgetId);
    }
  }

  /**
   * Handle widget error
   */
  private async handleError(widgetId: string, error: Error): Promise<void> {
    const state = this.instances.get(widgetId);
    if (!state) return;

    try {
      state.contract.lifecycle?.onError?.(state.context, error);
    } catch (handlerError) {
      console.error(
        `[Lifecycle] Error handler failed for ${widgetId}:`,
        handlerError,
      );
    }
  }

  /**
   * Get current lifecycle state of a widget
   */
  getState(widgetId: string): WidgetInstanceState | undefined {
    return this.instances.get(widgetId);
  }

  /**
   * Check if widget is mounted
   */
  isMounted(widgetId: string): boolean {
    return this.instances.get(widgetId)?.mounted ?? false;
  }

  /**
   * Get all active widget instances
   */
  getActiveWidgets(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Get lifecycle event history
   */
  getEventHistory(): ReadonlyArray<LifecycleEvent> {
    return this.eventHistory;
  }

  /**
   * Clear all instances (use for testing/cleanup)
   */
  async reset(): Promise<void> {
    const widgetIds = Array.from(this.instances.keys());
    
    for (const widgetId of widgetIds) {
      await this.unmount(widgetId);
    }
    
    this.instances.clear();
    this.eventHistory = [];
  }
}

// Singleton instance
export const widgetLifecycleManager = new WidgetLifecycleManager({
  enableLogging: true, // Enable in development
});

// Export for testing
export { WidgetLifecycleManager };
