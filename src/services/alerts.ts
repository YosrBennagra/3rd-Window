import { AlertItem, MetricSnapshot } from '../types/widgets';
import type { AlertRule } from '../state/store';

export function evaluateAlerts(
  metrics: MetricSnapshot,
  rules: AlertRule[] = []
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const now = Date.now();

  // Evaluate custom rules
  for (const rule of rules) {
    if (!rule.enabled) continue;

    const value = getMetricValue(metrics, rule.metric);
    if (value === null) continue;

    let triggered = false;
    if (rule.operator === 'gt' && value > rule.threshold) triggered = true;
    if (rule.operator === 'lt' && value < rule.threshold) triggered = true;
    if (rule.operator === 'eq' && value === rule.threshold) triggered = true;

    if (triggered) {
      alerts.push({
        id: `${rule.id}-${now}`,
        severity: rule.severity,
        title: `${rule.metric} threshold exceeded`,
        message: `${rule.metric} is ${value.toFixed(1)} (${rule.operator} ${rule.threshold})`,
        createdAt: now
      });
    }
  }

  // Fallback to legacy hardcoded rules if no custom rules
  if (rules.length === 0) {
    if (metrics.cpuTempC > 80) {
      alerts.push({
        id: `cpu-${now}`,
        severity: 'critical',
        title: 'CPU temperature high',
        message: `CPU at ${metrics.cpuTempC.toFixed(1)}°C`,
        createdAt: now
      });
    } else if (metrics.cpuTempC > 72) {
      alerts.push({
        id: `cpu-${now}`,
        severity: 'warning',
        title: 'CPU temperature elevated',
        message: `CPU at ${metrics.cpuTempC.toFixed(1)}°C`,
        createdAt: now
      });
    }

    if (metrics.gpuTempC > 78) {
      alerts.push({
        id: `gpu-${now}`,
        severity: 'warning',
        title: 'GPU temperature elevated',
        message: `GPU at ${metrics.gpuTempC.toFixed(1)}°C`,
      createdAt: now
      });
    }

    const ramPct = (metrics.ramUsedBytes / metrics.ramTotalBytes) * 100;
    if (ramPct > 90) {
      alerts.push({
        id: `ram-${now}`,
        severity: 'warning',
        title: 'RAM pressure',
        message: `RAM at ${ramPct.toFixed(0)}%`,
        createdAt: now
      });
    }

    const diskPct = (metrics.diskUsedBytes / metrics.diskTotalBytes) * 100;
    if (diskPct > 85) {
      alerts.push({
        id: `disk-${now}`,
        severity: 'info',
        title: 'Disk filling up',
        message: `Disk at ${diskPct.toFixed(0)}%`,
        createdAt: now
      });
    }

    if (metrics.netDownMbps < 10) {
      alerts.push({
        id: `net-${now}`,
        severity: 'warning',
        title: 'Slow download',
        message: `${metrics.netDownMbps.toFixed(1)} Mbps down`,
        createdAt: now
      });
    }
  }

  return alerts.slice(0, 4);
}

function getMetricValue(metrics: MetricSnapshot, metricName: string): number | null {
  const map: Record<string, number> = {
    'CPU Temperature': metrics.cpuTempC,
    'GPU Temperature': metrics.gpuTempC,
    'RAM Usage %': (metrics.ramUsedBytes / metrics.ramTotalBytes) * 100,
    'Disk Usage %': (metrics.diskUsedBytes / metrics.diskTotalBytes) * 100,
    'Download Speed': metrics.netDownMbps,
    'Upload Speed': metrics.netUpMbps
  };
  return map[metricName] ?? null;
}
