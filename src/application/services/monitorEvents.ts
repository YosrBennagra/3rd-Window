/**
 * Multi-Monitor Event Handling
 * 
 * Listens for monitor hot-plug events and handles graceful recovery.
 * Following multi-monitor UX principles:
 * - Graceful handling of monitor disconnection
 * - Safe window recovery
 * - User notifications for critical events
 */

import { listen } from '@tauri-apps/api/event';
import type { Monitor } from '../../types/ipc';
import { useStore } from '../stores/store';

/**
 * Monitor change event types
 */
export type MonitorEvent =
  | {
      type: 'configurationChanged';
      monitors: Monitor[];
      previousCount: number;
      currentCount: number;
    }
  | {
      type: 'monitorDisconnected';
      monitorIndex: number;
      monitorName: string;
    }
  | {
      type: 'monitorConnected';
      monitorIndex: number;
      monitorName: string;
    };

/**
 * Monitor event handler
 */
class MonitorEventHandler {
  private unlistenFn: (() => void) | null = null;

  /**
   * Start listening for monitor events
   */
  async start(): Promise<void> {
    console.info('[MonitorEventHandler] Starting listener');

    const unlisten = await listen<MonitorEvent>('monitor-changed', (event) => {
      console.info('[MonitorEventHandler] Monitor event:', event.payload);
      this.handleEvent(event.payload);
    });

    this.unlistenFn = unlisten;
    console.info('[MonitorEventHandler] ✓ Listener active');
  }

  /**
   * Stop listening for monitor events
   */
  stop(): void {
    if (this.unlistenFn) {
      this.unlistenFn();
      this.unlistenFn = null;
      console.info('[MonitorEventHandler] Listener stopped');
    }
  }

  /**
   * Handle monitor event
   */
  private handleEvent(event: MonitorEvent): void {
    switch (event.type) {
      case 'configurationChanged':
        this.handleConfigurationChanged(event);
        break;
      case 'monitorDisconnected':
        this.handleMonitorDisconnected(event);
        break;
      case 'monitorConnected':
        this.handleMonitorConnected(event);
        break;
    }
  }

  /**
   * Handle monitor configuration change (resolution, position, etc.)
   */
  private handleConfigurationChanged(event: {
    monitors: Monitor[];
    previousCount: number;
    currentCount: number;
  }): void {
    console.info(
      `[MonitorEventHandler] Configuration changed: ${event.previousCount} -> ${event.currentCount} monitors`
    );

    // Refresh monitor list in store
    useStore.getState().loadMonitors();

    // Show notification if count changed
    if (event.previousCount !== event.currentCount) {
      this.showNotification(
        'Monitor Configuration Changed',
        `Display count changed from ${event.previousCount} to ${event.currentCount}`
      );
    }
  }

  /**
   * Handle monitor disconnection with safe recovery
   */
  private handleMonitorDisconnected(event: {
    monitorIndex: number;
    monitorName: string;
  }): void {
    console.warn(
      `[MonitorEventHandler] Monitor disconnected: '${event.monitorName}' (index: ${event.monitorIndex})`
    );

    const store = useStore.getState();
    const currentSettings = store.settings;

    // If the disconnected monitor was selected, fall back to primary
    if (currentSettings.selectedMonitor === event.monitorIndex) {
      console.warn('[MonitorEventHandler] Selected monitor disconnected, falling back to primary');

      this.showNotification(
        'Monitor Disconnected',
        `'${event.monitorName}' was disconnected. Moving to primary display.`,
        'warning'
      );

      // Move to primary monitor (index 0)
      store.setSelectedMonitor(0).catch((error) => {
        console.error('[MonitorEventHandler] Failed to move to primary:', error);
      });
    } else {
      // Just notify user
      this.showNotification(
        'Monitor Disconnected',
        `'${event.monitorName}' was disconnected`,
        'info'
      );
    }

    // Refresh monitor list
    store.loadMonitors();
  }

  /**
   * Handle monitor connection
   */
  private handleMonitorConnected(event: {
    monitorIndex: number;
    monitorName: string;
  }): void {
    console.info(
      `[MonitorEventHandler] Monitor connected: '${event.monitorName}' (index: ${event.monitorIndex})`
    );

    this.showNotification(
      'Monitor Connected',
      `'${event.monitorName}' is now available`,
      'success'
    );

    // Refresh monitor list
    useStore.getState().loadMonitors();
  }

  /**
   * Show user notification
   */
  private showNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): void {
    // Check if Notification API is available
    if (!('Notification' in window)) {
      console.warn('[MonitorEventHandler] Notifications not supported');
      return;
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          this.sendNotification(title, message, type);
        }
      });
    } else if (Notification.permission === 'granted') {
      this.sendNotification(title, message, type);
    }

    // Also log to console
    const logFn = type === 'error' ? console.error : type === 'warning' ? console.warn : console.info;
    logFn(`[Notification] ${title}: ${message}`);
  }

  /**
   * Send native notification
   */
  private sendNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error'
  ): void {
    const icon = this.getNotificationIcon(type);
    
    new Notification(title, {
      body: message,
      icon,
      tag: 'monitor-event',
      requireInteraction: type === 'error' || type === 'warning',
    });
  }

  /**
   * Get icon for notification type
   */
  private getNotificationIcon(type: string): string | undefined {
    // You can replace these with actual icon paths
    const icons: Record<string, string> = {
      info: '/icons/info.png',
      success: '/icons/success.png',
      warning: '/icons/warning.png',
      error: '/icons/error.png',
    };
    return icons[type];
  }
}

// Singleton instance
const monitorEventHandler = new MonitorEventHandler();

/**
 * Initialize monitor event handling
 * Call this in your app initialization
 */
export async function initMonitorEventHandling(): Promise<void> {
  await monitorEventHandler.start();
}

/**
 * Stop monitor event handling
 * Call this on app cleanup
 */
export function stopMonitorEventHandling(): void {
  monitorEventHandler.stop();
}

/**
 * Export the handler for testing
 */
export { monitorEventHandler };
