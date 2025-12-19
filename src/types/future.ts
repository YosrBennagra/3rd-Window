// Placeholder types for future widget system

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  createdAt: Date;
}

export interface MetricSnapshot {
  cpu: number;
  memory: number;
  disk: number;
  network: { up: number; down: number };
  temperature: { cpu: number; gpu: number };
  // Extended properties for widgets
  cpuUsage: number;
  cpuTemp: number;
  cpuTempC: number;
  gpuTemp: number;
  gpuTempC: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  netDownMbps: number;
  netUpMbps: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  source: string;
  summary?: string;
  receivedAt?: Date;
  priority?: 'info' | 'warning' | 'critical';
  timestamp: Date;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  connected: boolean;
  lastSync?: Date;
}

export interface PipelineStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  lastRun?: Date;
}

export interface ShortcutItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
}
