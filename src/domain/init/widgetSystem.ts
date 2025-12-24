/**
 * Widget System Initialization
 * 
 * Registers all widget contracts and initializes the widget system.
 * This module should be imported early in the application lifecycle.
 */

import { contractWidgetRegistry } from '../registries/ContractWidgetRegistry';
import { getAllWidgetContracts } from '../contracts/widgetContracts';
import { widgetLifecycleManager } from '../../application/services/widgetLifecycle';

/**
 * Initialize the widget system
 * 
 * This function:
 * 1. Registers all widget contracts
 * 2. Validates all contracts
 * 3. Configures lifecycle manager
 * 4. Reports any issues
 */
export function initializeWidgetSystem(): void {
  console.info('[WidgetSystem] Initializing widget system...');

  // Configure lifecycle manager
  widgetLifecycleManager.configure({
    enableLogging: true, // Enable logging in development/production
  });

  // Get all widget contracts
  const contracts = getAllWidgetContracts();
  
  console.info(`[WidgetSystem] Found ${contracts.length} widget contracts to register`);

  // Register all contracts
  let successCount = 0;
  let failureCount = 0;
  const failures: Array<{ id: string; error: string }> = [];

  for (const contract of contracts) {
    const result = contractWidgetRegistry.register(contract);
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
      failures.push({ id: contract.id, error: result.error ?? 'Unknown error' });
    }
  }

  // Report results
  console.info(
    `[WidgetSystem] Registration complete: ${successCount} succeeded, ${failureCount} failed`,
  );

  if (failures.length > 0) {
    console.error('[WidgetSystem] Failed to register widgets:', failures);
  }

  // Print registry status (always for now)
  contractWidgetRegistry.printStatus();

  // Warn about validation issues
  const contractsWithWarnings = contractWidgetRegistry.getContractsWithWarnings();
  if (contractsWithWarnings.length > 0) {
    console.warn(
      `[WidgetSystem] ${contractsWithWarnings.length} widgets have validation warnings`,
    );
  }

  console.info('[WidgetSystem] Widget system initialized successfully');
}

/**
 * Cleanup widget system (for testing or shutdown)
 */
export async function shutdownWidgetSystem(): Promise<void> {
  console.info('[WidgetSystem] Shutting down widget system...');
  
  // Unmount all active widgets
  await widgetLifecycleManager.reset();
  
  // Clear registry
  contractWidgetRegistry.clear();
  
  console.info('[WidgetSystem] Widget system shutdown complete');
}

/**
 * Get widget system health status
 */
export function getWidgetSystemHealth(): {
  healthy: boolean;
  stats: ReturnType<typeof contractWidgetRegistry.getStats>;
  activeWidgets: number;
  issues: string[];
} {
  const stats = contractWidgetRegistry.getStats();
  const activeWidgets = widgetLifecycleManager.getActiveWidgets().length;
  const issues: string[] = [];

  // Check for issues
  if (stats.totalWidgets === 0) {
    issues.push('No widgets registered');
  }

  if (stats.validationWarnings > 0) {
    issues.push(`${stats.validationWarnings} validation warnings`);
  }

  const contractsWithWarnings = contractWidgetRegistry.getContractsWithWarnings();
  if (contractsWithWarnings.length > 0) {
    issues.push(`${contractsWithWarnings.length} widgets have warnings`);
  }

  return {
    healthy: issues.length === 0,
    stats,
    activeWidgets,
    issues,
  };
}
