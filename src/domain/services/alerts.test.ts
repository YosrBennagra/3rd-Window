/**
 * Unit Tests: Alert Evaluation
 * 
 * Tests pure alert evaluation logic in domain/services/alerts.ts
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateAlerts,
  createDefaultAlertRules,
  type AlertRule,
} from '@domain/services/alerts';
import { createMockMetrics } from '@/test/utils/test-helpers';

describe('evaluateAlerts', () => {
  const timestamp = 1704067200000; // Fixed timestamp for testing

  it('returns empty array when no rules', () => {
    const metrics = createMockMetrics();
    const result = evaluateAlerts(metrics, [], timestamp);
    expect(result).toEqual([]);
  });

  it('evaluates greater-than rules correctly', () => {
    const metrics = createMockMetrics({ cpuTempC: 85 });
    const rules: AlertRule[] = [
      {
        id: 'cpu-temp-high',
        enabled: true,
        metric: 'CPU Temperature',
        operator: 'gt',
        threshold: 80,
        severity: 'critical',
      },
    ];

    const result = evaluateAlerts(metrics, rules, timestamp);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      severity: 'critical',
      title: 'CPU Temperature threshold exceeded',
    });
    expect(result[0].message).toContain('85.0');
  });

  it('evaluates less-than rules correctly', () => {
    const metrics = createMockMetrics({ cpuUsage: 10 });
    const rules: AlertRule[] = [
      {
        id: 'cpu-idle',
        enabled: true,
        metric: 'CPU Usage',
        operator: 'lt',
        threshold: 20,
        severity: 'info',
      },
    ];

    const result = evaluateAlerts(metrics, rules, timestamp);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('info');
  });

  it('evaluates equal rules correctly', () => {
    const metrics = createMockMetrics({ cpuUsage: 50 });
    const rules: AlertRule[] = [
      {
        id: 'cpu-exact',
        enabled: true,
        metric: 'CPU Usage',
        operator: 'eq',
        threshold: 50,
        severity: 'info',
      },
    ];

    const result = evaluateAlerts(metrics, rules, timestamp);
    expect(result).toHaveLength(1);
  });

  it('skips disabled rules', () => {
    const metrics = createMockMetrics({ cpuTempC: 85 });
    const rules: AlertRule[] = [
      {
        id: 'cpu-temp-high',
        enabled: false,
        metric: 'CPU Temperature',
        operator: 'gt',
        threshold: 80,
        severity: 'critical',
      },
    ];

    const result = evaluateAlerts(metrics, rules, timestamp);
    expect(result).toHaveLength(0);
  });

  it('evaluates multiple rules', () => {
    const metrics = createMockMetrics({
      cpuTempC: 85,
      cpuUsage: 90,
    });
    const rules: AlertRule[] = [
      {
        id: 'cpu-temp',
        enabled: true,
        metric: 'CPU Temperature',
        operator: 'gt',
        threshold: 80,
        severity: 'critical',
      },
      {
        id: 'cpu-usage',
        enabled: true,
        metric: 'CPU Usage',
        operator: 'gt',
        threshold: 85,
        severity: 'warning',
      },
    ];

    const result = evaluateAlerts(metrics, rules, timestamp);
    expect(result).toHaveLength(2);
    expect(result[0].severity).toBe('critical');
    expect(result[1].severity).toBe('warning');
  });

  it('handles unknown metrics gracefully', () => {
    const metrics = createMockMetrics();
    const rules: AlertRule[] = [
      {
        id: 'unknown',
        enabled: true,
        metric: 'Unknown Metric',
        operator: 'gt',
        threshold: 50,
        severity: 'info',
      },
    ];

    const result = evaluateAlerts(metrics, rules, timestamp);
    expect(result).toHaveLength(0);
  });

  it('generates unique alert IDs', () => {
    const metrics = createMockMetrics({ cpuTempC: 85 });
    const rules: AlertRule[] = [
      {
        id: 'cpu-temp',
        enabled: true,
        metric: 'CPU Temperature',
        operator: 'gt',
        threshold: 80,
        severity: 'critical',
      },
    ];

    const result1 = evaluateAlerts(metrics, rules, timestamp);
    const result2 = evaluateAlerts(metrics, rules, timestamp + 1000);

    expect(result1[0].id).not.toBe(result2[0].id);
  });
});

describe('createDefaultAlertRules', () => {
  it('creates default rules', () => {
    const rules = createDefaultAlertRules();
    expect(rules.length).toBeGreaterThan(0);
  });

  it('creates CPU temperature rules', () => {
    const rules = createDefaultAlertRules();
    const cpuRules = rules.filter((r: AlertRule) => r.metric === 'CPU Temperature');
    expect(cpuRules.length).toBeGreaterThanOrEqual(2);
  });

  it('creates CPU usage rule', () => {
    const rules = createDefaultAlertRules();
    const cpuRule = rules.find((r: AlertRule) => r.metric === 'CPU Usage');
    expect(cpuRule).toBeDefined();
    expect(cpuRule?.threshold).toBe(85);
  });

  it('enables all default rules', () => {
    const rules = createDefaultAlertRules();
    expect(rules.every((r: AlertRule) => r.enabled)).toBe(true);
  });
});
