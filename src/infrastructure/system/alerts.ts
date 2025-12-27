import { AlertItem, MetricSnapshot } from '@domain/models/widgets';
import type { AlertRule } from '../../application/store';

export function evaluateAlerts(
  metrics: MetricSnapshot,
  rules: AlertRule[] = []
): AlertItem[] {
  const now = new Date();

  const makeAlert = (id: string, severity: AlertItem['severity'], title: string, message: string, ts = now): AlertItem => ({
    id: `${id}-${ts}`,
    severity,
    title,
    message,
    timestamp: ts,
    createdAt: ts,
  });

  const evaluateCustomRules = (): AlertItem[] => {
    const out: AlertItem[] = [];
    for (const rule of rules) {
      if (!rule.enabled) continue;

      const value = getMetricValue(metrics, rule.metric);
      if (value === null) continue;

      const op = rule.operator;
      const triggered = (op === 'gt' && value > rule.threshold) || (op === 'lt' && value < rule.threshold) || (op === 'eq' && value === rule.threshold);
      if (!triggered) continue;

      out.push(makeAlert(rule.id, rule.severity, `${rule.metric} threshold exceeded`, `${rule.metric} is ${value.toFixed(1)} (${rule.operator} ${rule.threshold})`));
    }
    return out;
  };

  const evaluateLegacy = (): AlertItem[] => {
    const out: AlertItem[] = [];

    if (metrics.cpuTempC > 80) {
      out.push(makeAlert('cpu', 'critical', 'CPU temperature high', `CPU at ${metrics.cpuTempC.toFixed(1)}°C`));
    } else if (metrics.cpuTempC > 72) {
      out.push(makeAlert('cpu', 'warning', 'CPU temperature elevated', `CPU at ${metrics.cpuTempC.toFixed(1)}°C`));
    }

    if (metrics.gpuTempC > 78) {
      out.push(makeAlert('gpu', 'warning', 'GPU temperature elevated', `GPU at ${metrics.gpuTempC.toFixed(1)}°C`));
    }

    const ramPct = (metrics.ramUsedBytes / metrics.ramTotalBytes) * 100;
    if (ramPct > 90) {
      out.push(makeAlert('ram', 'warning', 'RAM pressure', `RAM at ${ramPct.toFixed(0)}%`));
    }

    const diskPct = (metrics.diskUsedBytes / metrics.diskTotalBytes) * 100;
    if (diskPct > 85) {
      out.push(makeAlert('disk', 'info', 'Disk filling up', `Disk at ${diskPct.toFixed(0)}%`));
    }

    if (metrics.netDownMbps < 10) {
      out.push(makeAlert('net', 'warning', 'Slow download', `${metrics.netDownMbps.toFixed(1)} Mbps down`));
    }

    return out;
  };

  const custom = evaluateCustomRules();
  if (custom.length > 0) return custom.slice(0, 4);

  return evaluateLegacy().slice(0, 4);
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
