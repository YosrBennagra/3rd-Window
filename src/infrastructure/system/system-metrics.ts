import { MetricSnapshot } from '@domain/models/widgets';
import { invoke } from '@tauri-apps/api/core';

export async function getSystemMetrics(): Promise<MetricSnapshot> {
  try {
    const metrics = await invoke<{
      cpu_usage: number;
      cpu_temp: number;
      gpu_temp: number;
      ram_used_bytes: number;
      ram_total_bytes: number;
      disk_used_bytes: number;
      disk_total_bytes: number;
      net_up_mbps: number;
      net_down_mbps: number;
    }>('get_system_metrics');

    return {
      cpu: metrics.cpu_usage,
      memory: (metrics.ram_used_bytes / metrics.ram_total_bytes) * 100,
      disk: (metrics.disk_used_bytes / metrics.disk_total_bytes) * 100,
      network: { up: metrics.net_up_mbps, down: metrics.net_down_mbps },
      temperature: { cpu: metrics.cpu_temp, gpu: metrics.gpu_temp },
      cpuUsage: metrics.cpu_usage,
      cpuTemp: metrics.cpu_temp,
      cpuTempC: metrics.cpu_temp,
      gpuTemp: metrics.gpu_temp,
      gpuTempC: metrics.gpu_temp,
      ramUsedBytes: metrics.ram_used_bytes,
      ramTotalBytes: metrics.ram_total_bytes,
      diskUsedBytes: metrics.disk_used_bytes,
      diskTotalBytes: metrics.disk_total_bytes,
      netUpMbps: metrics.net_up_mbps,
      netDownMbps: metrics.net_down_mbps,
    };
  } catch (error) {
    console.error('Failed to fetch system metrics:', error);
    // Fallback to mock data in case of error
    return {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: { up: 0, down: 0 },
      temperature: { cpu: 0, gpu: 0 },
      cpuUsage: 0,
      cpuTemp: 0,
      cpuTempC: 0,
      gpuTemp: 0,
      gpuTempC: 0,
      ramUsedBytes: 0,
      ramTotalBytes: 16 * 1024 * 1024 * 1024,
      diskUsedBytes: 0,
      diskTotalBytes: 512 * 1024 * 1024 * 1024,
      netUpMbps: 0,
      netDownMbps: 0,
    };
  }
}
