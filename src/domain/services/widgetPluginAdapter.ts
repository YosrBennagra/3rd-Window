/**
 * @deprecated This file has been moved to src/application/services/widgetPluginAdapter.ts
 * 
 * Domain layer should not import React types (ComponentType).
 * Please update your imports to use the application layer version:
 * 
 * Old: import { ... } from '../domain/services/widgetPluginAdapter'
 * New: import { ... } from '../application/services/widgetPluginAdapter'
 * 
 * This file is kept for backward compatibility and will be removed in v2.0
 */

export * from '../../application/services/widgetPluginAdapter';
