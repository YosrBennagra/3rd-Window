/**
 * Widget Plugin Registry (SOLID: Single Responsibility + Open/Closed)
 * 
 * This is the central registry for all widget plugins.
 * Responsibilities:
 * - Register/unregister plugins
 * - Validate plugin compatibility
 * - Track plugin state (enabled/disabled, errors, instances)
 * - Emit events for reactive UI updates
 * - Provide plugin discovery/lookup
 * 
 * Design Principles:
 * - Extension Point: Plugins register here without modifying core code
 * - Isolation: Plugin errors don't crash registry or other plugins
 * - Versioning: API compatibility checking prevents breaking changes
 * - Failure Containment: Faulty plugins auto-disable after error threshold
 */

import type {
  WidgetPlugin,
  WidgetPluginRegistration,
  WidgetPluginEvent,
  WidgetPluginCompatibility,
  WidgetPluginMetadata,
  WidgetErrorContext,
} from '../models/plugin';

// Maximum errors before auto-disabling a plugin
const MAX_PLUGIN_ERRORS = 5;

/**
 * Widget Plugin Registry
 * 
 * Singleton registry managing all widget plugins.
 * This is the extension point for the widget system.
 */
class WidgetPluginRegistry {
  private plugins = new Map<string, WidgetPluginRegistration>();
  private listeners = new Set<(event: WidgetPluginEvent) => void>();
  
  /**
   * Get current API version
   */
  getApiVersion(): string {
    return '1.0.0'; // WIDGET_PLUGIN_API_VERSION from plugin.ts
  }
  
  /**
   * Register a widget plugin
   * 
   * @param plugin - The plugin to register
   * @throws Error if plugin is incompatible or already registered
   */
  register(plugin: WidgetPlugin): void {
    // Validate plugin structure
    this.validatePluginStructure(plugin);
    
    // Check compatibility
    const compatibility = this.checkCompatibility(plugin.metadata);
    if (!compatibility.compatible) {
      throw new Error(`Plugin "${plugin.metadata.id}" is incompatible: ${compatibility.message}`);
    }
    
    // Check for duplicate
    if (this.plugins.has(plugin.metadata.id)) {
      console.warn(`[PluginRegistry] Overwriting plugin: ${plugin.metadata.id}`);
    }
    
    // Register plugin
    const registration: WidgetPluginRegistration = {
      plugin,
      registeredAt: new Date(),
      enabled: true,
      instanceCount: 0,
      errorCount: 0,
    };
    
    this.plugins.set(plugin.metadata.id, registration);
    this.emit({ type: 'plugin-registered', pluginId: plugin.metadata.id });
    
    console.log(`[PluginRegistry] Registered plugin: ${plugin.metadata.id} v${plugin.metadata.version}`);
  }
  
  /**
   * Unregister a widget plugin
   * 
   * @param pluginId - ID of plugin to unregister
   * @returns true if plugin was unregistered, false if not found
   */
  unregister(pluginId: string): boolean {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      return false;
    }
    
    // Check for active instances
    if (registration.instanceCount > 0) {
      console.warn(`[PluginRegistry] Unregistering plugin "${pluginId}" with ${registration.instanceCount} active instances`);
    }
    
    this.plugins.delete(pluginId);
    this.emit({ type: 'plugin-unregistered', pluginId });
    
    console.log(`[PluginRegistry] Unregistered plugin: ${pluginId}`);
    return true;
  }
  
  /**
   * Get a registered plugin
   * 
   * @param pluginId - Plugin ID to look up
   * @returns Plugin if found and enabled, undefined otherwise
   */
  get(pluginId: string): WidgetPlugin | undefined {
    const registration = this.plugins.get(pluginId);
    return registration?.enabled ? registration.plugin : undefined;
  }
  
  /**
   * Get plugin registration info (includes state)
   * 
   * @param pluginId - Plugin ID to look up
   * @returns Registration info if found, undefined otherwise
   */
  getRegistration(pluginId: string): WidgetPluginRegistration | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }
  
  /**
   * Check if a plugin is registered and enabled
   */
  isEnabled(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.enabled ?? false;
  }
  
  /**
   * Enable a plugin
   */
  enable(pluginId: string): boolean {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      return false;
    }
    
    if (!registration.enabled) {
      registration.enabled = true;
      registration.errorCount = 0; // Reset error count on re-enable
      this.emit({ type: 'plugin-enabled', pluginId });
      console.log(`[PluginRegistry] Enabled plugin: ${pluginId}`);
    }
    
    return true;
  }
  
  /**
   * Disable a plugin
   */
  disable(pluginId: string): boolean {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      return false;
    }
    
    if (registration.enabled) {
      registration.enabled = false;
      this.emit({ type: 'plugin-disabled', pluginId });
      console.log(`[PluginRegistry] Disabled plugin: ${pluginId}`);
    }
    
    return true;
  }
  
  /**
   * Get all registered plugin IDs
   */
  getAllIds(): string[] {
    return Array.from(this.plugins.keys());
  }
  
  /**
   * Get all enabled plugin IDs
   */
  getEnabledIds(): string[] {
    return Array.from(this.plugins.entries())
      .filter(([_, reg]) => reg.enabled)
      .map(([id, _]) => id);
  }
  
  /**
   * Get metadata for all enabled plugins
   */
  getAllMetadata(): WidgetPluginMetadata[] {
    return Array.from(this.plugins.values())
      .filter((reg) => reg.enabled)
      .map((reg) => reg.plugin.metadata);
  }
  
  /**
   * Get all plugin registrations (for debugging/admin UI)
   */
  getAllRegistrations(): Map<string, WidgetPluginRegistration> {
    return new Map(this.plugins);
  }
  
  /**
   * Increment instance count for a plugin
   * Called when a widget of this type is created
   */
  incrementInstanceCount(pluginId: string): void {
    const registration = this.plugins.get(pluginId);
    if (registration) {
      registration.instanceCount++;
    }
  }
  
  /**
   * Decrement instance count for a plugin
   * Called when a widget of this type is destroyed
   */
  decrementInstanceCount(pluginId: string): void {
    const registration = this.plugins.get(pluginId);
    if (registration && registration.instanceCount > 0) {
      registration.instanceCount--;
    }
  }
  
  /**
   * Report an error from a plugin
   * 
   * @param pluginId - Plugin that encountered the error
   * @param error - The error that occurred
   * @param context - Context about the error
   */
  reportError(pluginId: string, error: Error, context: WidgetErrorContext): void {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      console.error(`[PluginRegistry] Error reported for unknown plugin: ${pluginId}`, error);
      return;
    }
    
    registration.errorCount++;
    registration.lastError = {
      error,
      timestamp: new Date(),
      context,
    };
    
    this.emit({ type: 'plugin-error', pluginId, error, context });
    
    console.error(`[PluginRegistry] Plugin "${pluginId}" error #${registration.errorCount}:`, error, context);
    
    // Auto-disable plugin if error threshold exceeded
    if (registration.errorCount >= MAX_PLUGIN_ERRORS && registration.enabled) {
      console.error(`[PluginRegistry] Auto-disabling plugin "${pluginId}" after ${MAX_PLUGIN_ERRORS} errors`);
      this.disable(pluginId);
    }
  }
  
  /**
   * Check if a plugin is compatible with current API version
   */
  checkCompatibility(metadata: WidgetPluginMetadata): WidgetPluginCompatibility {
    const currentVersion = this.getApiVersion();
    const pluginVersion = metadata.apiVersion;
    const minVersion = metadata.minApiVersion || pluginVersion;
    
    // Simple version comparison (works for semantic versioning)
    const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
    const [pluginMajor] = pluginVersion.split('.').map(Number);
    const [minMajor, minMinor] = minVersion.split('.').map(Number);
    
    // Check if plugin API version is too new
    if (pluginMajor > currentMajor) {
      return {
        compatible: false,
        status: 'too-new',
        message: `Plugin requires API v${pluginVersion}, but current is v${currentVersion}`,
        action: 'update-app',
      };
    }
    
    // Check if current API version is too old for plugin's minimum requirement
    if (currentMajor < minMajor || (currentMajor === minMajor && currentMinor < minMinor)) {
      return {
        compatible: false,
        status: 'too-old',
        message: `Plugin requires at least API v${minVersion}, but current is v${currentVersion}`,
        action: 'update-plugin',
      };
    }
    
    // Check for major version mismatch (breaking changes)
    if (pluginMajor < currentMajor) {
      return {
        compatible: false,
        status: 'needs-update',
        message: `Plugin targets API v${pluginVersion}, but current is v${currentVersion} (major version mismatch)`,
        action: 'update-plugin',
      };
    }
    
    // Compatible!
    return {
      compatible: true,
      status: 'compatible',
      message: `Plugin is compatible with current API v${currentVersion}`,
      action: 'none',
    };
  }
  
  /**
   * Validate plugin structure
   * Ensures plugin has all required fields
   */
  private validatePluginStructure(plugin: WidgetPlugin): void {
    const errors: string[] = [];
    
    if (!plugin.metadata?.id) {
      errors.push('Plugin must have metadata.id');
    }
    if (!plugin.metadata?.name) {
      errors.push('Plugin must have metadata.name');
    }
    if (!plugin.metadata?.version) {
      errors.push('Plugin must have metadata.version');
    }
    if (!plugin.metadata?.apiVersion) {
      errors.push('Plugin must have metadata.apiVersion');
    }
    if (!plugin.config) {
      errors.push('Plugin must have config');
    }
    if (!plugin.component) {
      errors.push('Plugin must have component');
    }
    if (plugin.config && !plugin.config.constraints) {
      errors.push('Plugin config must have constraints');
    }
    
    if (errors.length > 0) {
      throw new Error(`Invalid plugin structure:\n${errors.join('\n')}`);
    }
  }
  
  /**
   * Subscribe to registry events
   */
  subscribe(listener: (event: WidgetPluginEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Emit an event to all subscribers
   */
  private emit(event: WidgetPluginEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[PluginRegistry] Error in event listener:', error);
      }
    });
  }
  
  /**
   * Reset registry (for testing)
   */
  clear(): void {
    this.plugins.clear();
    this.listeners.clear();
    console.log('[PluginRegistry] Registry cleared');
  }
}

// Export singleton instance
export const widgetPluginRegistry = new WidgetPluginRegistry();

// Export class for testing
export { WidgetPluginRegistry };
