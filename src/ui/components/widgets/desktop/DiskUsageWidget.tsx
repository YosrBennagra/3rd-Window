/**
 * Desktop Disk Usage widget simply re-uses the shared widget implementation.
 * Keeping this thin shim avoids duplicating rendering logic between desktop
 * and panel widget hosts.
 */
export { DiskUsageWidget } from '../DiskUsageWidget';
export { DiskUsageWidget as default } from '../DiskUsageWidget';
