/**
 * Domain Logic: Alert Evaluation
 * 
 * Pure alert evaluation logic extracted from infrastructure.
 * Testable without Tauri or system dependencies.
 */

import type { AlertItem, MetricSnapshot } from '../models/widgets';

export type AlertOperator = 'gt' | 'lt' | 'eq';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertRule {
  id: string;
  enabled: boolean;
  metric: string;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
}

/**
 * Evaluate alert rules against metrics
 * @pure - Pass timestamp as parameter for testability
 */
export function evaluateAlerts(
  metrics: MetricSnapshot,
  rules: AlertRule[],
  timestamp: number = Date.now()
): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const value = getMetricValue(metrics, rule.metric);
    if (value === null) continue;

    if (shouldTrigger(value, rule.operator, rule.threshold)) {
      alerts.push(createAlert(rule, value, timestamp));
    }
  }

  return alerts;
}

/**
 * Check if alert should trigger
 * @pure
 */
function shouldTrigger(value: number, operator: AlertOperator, threshold: number): boolean {
  switch (operator) {
    case 'gt':
      return value > threshold;
    case 'lt':
      return value < threshold;
    case 'eq':
      return value === threshold;
    default:
      return false;
  }
}

/**
 * Create alert item from rule and value
 * @pure
 */
function createAlert(rule: AlertRule, value: number, timestamp: number): AlertItem {
  return {
    id: `${rule.id}-${timestamp}`,
    severity: rule.severity,
    title: `${rule.metric} threshold exceeded`,
    message: `${rule.metric} is ${value.toFixed(1)} (${rule.operator} ${rule.threshold})`,
    timestamp: new Date(timestamp),
    createdAt: new Date(timestamp),
  };
}

/**
 * Extract metric value from snapshot
 * @pure
 */
function getMetricValue(metrics: MetricSnapshot, metricName: string): number | null {
  const normalized = metricName.toLowerCase();

  if (normalized.includes('cpu') && normalized.includes('usage')) return metrics.cpuUsage;
  if (normalized.includes('cpu') && normalized.includes('temp')) return metrics.cpuTempC;
  if (normalized.includes('gpu') && normalized.includes('temp')) return metrics.gpuTempC;

  return null;
}

/**
 * Create default alert rules
 * @pure
 */
export function createDefaultAlertRules(): AlertRule[] {
  return [
    {
      id: 'cpu-temp-critical',
      enabled: true,
      metric: 'CPU Temperature',
      operator: 'gt',
      threshold: 80,
      severity: 'critical',
    },
    {
      id: 'cpu-temp-warning',
      enabled: true,
      metric: 'CPU Temperature',
      operator: 'gt',
      threshold: 72,
      severity: 'warning',
    },
    {
      id: 'cpu-usage-warning',
      enabled: true,
      metric: 'CPU Usage',
      operator: 'gt',
      threshold: 85,
      severity: 'warning',
    },
  ];
}
