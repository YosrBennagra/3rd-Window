/**
 * Contract-Based Widget Registry
 * 
 * This registry enforces widget contract compliance and provides
 * type-safe widget registration and retrieval.
 * 
 * Core Principles:
 * - Every widget MUST have a valid contract
 * - Widgets are validated before registration
 * - No widget-specific logic in core systems
 * - Registry is the single source of truth for widget capabilities
 */

import type { WidgetContract, WidgetContractValidation, WidgetId } from '../contracts/WidgetContract';
import { validateWidgetContract } from '../contracts/WidgetContract';

/**
 * Widget registration result
 */
interface RegistrationResult {
  success: boolean;
  widgetId?: WidgetId;
  validation?: WidgetContractValidation;
  error?: string;
}

/**
 * Widget query filters
 */
interface WidgetQuery {
  category?: string;
  mode?: 'dashboard' | 'desktop' | 'both';
  enabled?: boolean;
  resizable?: boolean;
}

/**
 * Registry statistics
 */
interface RegistryStats {
  totalWidgets: number;
  enabledWidgets: number;
  disabledWidgets: number;
  categoriesCount: number;
  validationWarnings: number;
}

/**
 * Contract-Based Widget Registry
 * 
 * Manages widget contracts with strict validation.
 * Widgets cannot be registered without a valid contract.
 */
class ContractBasedWidgetRegistry {
  // Locale-aware alphabetical compare used across the registry
  private static compareAlpha(a: string, b: string): number {
    return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
  }
  private contracts = new Map<WidgetId, WidgetContract>();
  private validations = new Map<WidgetId, WidgetContractValidation>();
  private registrationOrder: WidgetId[] = [];

  /**
   * Register a widget contract
   * 
   * @param contract - Widget contract to register
   * @param options - Registration options
   * @returns Registration result
   */
  register(
    contract: WidgetContract,
    options: { skipValidation?: boolean; allowOverwrite?: boolean } = {},
  ): RegistrationResult {
    const { skipValidation = false, allowOverwrite = false } = options;

    // Check for duplicate
    if (this.contracts.has(contract.id) && !allowOverwrite) {
      return {
        success: false,
        error: `Widget '${contract.id}' is already registered. Use allowOverwrite option to replace.`,
      };
    }

    // Validate contract (unless skipped)
    let validation: WidgetContractValidation = { valid: true, errors: [], warnings: [] };
    if (!skipValidation) {
      validation = validateWidgetContract(contract);
      
      if (!validation.valid) {
        console.error(`[WidgetRegistry] Failed to register '${contract.id}':`, validation.errors);
        return {
          success: false,
          validation,
          error: `Contract validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Log warnings but allow registration
      if (validation.warnings.length > 0) {
        console.warn(`[WidgetRegistry] Warnings for '${contract.id}':`, validation.warnings);
      }
    }

    // Register the contract
    this.contracts.set(contract.id, contract);
    this.validations.set(contract.id, validation);
    
    if (!this.registrationOrder.includes(contract.id)) {
      this.registrationOrder.push(contract.id);
    }

    console.info(`[WidgetRegistry] Registered widget: ${contract.id} (${contract.displayName})`);

    return {
      success: true,
      widgetId: contract.id,
      validation,
    };
  }

  /**
   * Bulk register multiple widgets
   */
  registerMany(contracts: WidgetContract[]): RegistrationResult[] {
    return contracts.map((contract) => this.register(contract));
  }

  /**
   * Unregister a widget
   */
  unregister(widgetId: WidgetId): boolean {
    const existed = this.contracts.delete(widgetId);
    this.validations.delete(widgetId);
    
    const index = this.registrationOrder.indexOf(widgetId);
    if (index !== -1) {
      this.registrationOrder.splice(index, 1);
    }

    if (existed) {
      console.info(`[WidgetRegistry] Unregistered widget: ${widgetId}`);
    }

    return existed;
  }

  /**
   * Get a widget contract by ID
   */
  get(widgetId: WidgetId): WidgetContract | undefined {
    return this.contracts.get(widgetId);
  }

  /**
   * Check if a widget is registered
   */
  has(widgetId: WidgetId): boolean {
    return this.contracts.has(widgetId);
  }

  /**
   * Get all registered widget IDs
   */
  getAllIds(): WidgetId[] {
    return Array.from(this.contracts.keys());
  }

  /**
   * Get all widget contracts
   */
  getAll(): WidgetContract[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Get widgets in registration order
   */
  getInRegistrationOrder(): WidgetContract[] {
    return this.registrationOrder
      .map((id) => this.contracts.get(id))
      .filter((contract): contract is WidgetContract => contract !== undefined);
  }

  /**
   * Query widgets by criteria
   */
  query(filters: WidgetQuery): WidgetContract[] {
    return this.getAll().filter((contract) => {
      if (filters.category !== undefined && contract.category !== filters.category) {
        return false;
      }

      if (filters.mode !== undefined) {
        if (!contract.supportedModes.includes(filters.mode) && !contract.supportedModes.includes('both')) {
          return false;
        }
      }

      if (filters.enabled !== undefined) {
        const isEnabled = contract.enabled !== false;
        if (isEnabled !== filters.enabled) {
          return false;
        }
      }

      if (filters.resizable !== undefined && contract.sizeConstraints.resizable !== filters.resizable) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get widgets by category
   */
  getByCategory(category: string): WidgetContract[] {
    return this.query({ category });
  }

  /**
   * Get widgets by mode
   */
  getByMode(mode: 'dashboard' | 'desktop' | 'both'): WidgetContract[] {
    return this.query({ mode });
  }

  /**
   * Get only enabled widgets
   */
  getEnabled(): WidgetContract[] {
    return this.query({ enabled: true });
  }

  /**
   * Get validation result for a widget
   */
  getValidation(widgetId: WidgetId): WidgetContractValidation | undefined {
    return this.validations.get(widgetId);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const contract of this.contracts.values()) {
      categories.add(contract.category);
    }
    return Array.from(categories).sort(ContractBasedWidgetRegistry.compareAlpha);
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const all = this.getAll();
    const enabled = this.getEnabled();
    const categories = this.getCategories();
    
    let warningsCount = 0;
    for (const validation of this.validations.values()) {
      warningsCount += validation.warnings.length;
    }

    return {
      totalWidgets: all.length,
      enabledWidgets: enabled.length,
      disabledWidgets: all.length - enabled.length,
      categoriesCount: categories.length,
      validationWarnings: warningsCount,
    };
  }

  /**
   * Validate all registered widgets
   * Useful for health checks
   */
  validateAll(): Map<WidgetId, WidgetContractValidation> {
    const results = new Map<WidgetId, WidgetContractValidation>();
    
    for (const [widgetId, contract] of this.contracts.entries()) {
      const validation = validateWidgetContract(contract);
      results.set(widgetId, validation);
    }

    return results;
  }

  /**
   * Get contracts with validation warnings
   */
  getContractsWithWarnings(): Array<{ contract: WidgetContract; validation: WidgetContractValidation }> {
    const result: Array<{ contract: WidgetContract; validation: WidgetContractValidation }> = [];

    for (const [widgetId, validation] of this.validations.entries()) {
      if (validation.warnings.length > 0) {
        const contract = this.contracts.get(widgetId);
        if (contract) {
          result.push({ contract, validation });
        }
      }
    }

    return result;
  }

  /**
   * Export registry as JSON (for debugging/inspection)
   */
  export(): Record<WidgetId, WidgetContract> {
    return Object.fromEntries(this.contracts.entries());
  }

  /**
   * Clear all registrations (for testing)
   */
  clear(): void {
    this.contracts.clear();
    this.validations.clear();
    this.registrationOrder = [];
    console.info('[WidgetRegistry] Cleared all registrations');
  }

  /**
   * Print registry status to console
   */
  printStatus(): void {
    const stats = this.getStats();
    const warnings = this.getContractsWithWarnings();

    console.group('[WidgetRegistry] Status');
    console.log(`Total Widgets: ${stats.totalWidgets}`);
    console.log(`Enabled: ${stats.enabledWidgets}`);
    console.log(`Disabled: ${stats.disabledWidgets}`);
    console.log(`Categories: ${stats.categoriesCount}`);
    console.log(`Validation Warnings: ${stats.validationWarnings}`);
    
    if (warnings.length > 0) {
      console.group('Widgets with Warnings:');
      warnings.forEach(({ contract, validation }) => {
        console.warn(`${contract.id}: ${validation.warnings.join(', ')}`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// Singleton instance
export const contractWidgetRegistry = new ContractBasedWidgetRegistry();

// Export class for testing
export { ContractBasedWidgetRegistry };
export type { RegistrationResult, WidgetQuery, RegistryStats };
