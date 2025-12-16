import { MetricSnapshot } from '../types/widgets';
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
      cpuUsage: metrics.cpu_usage,
      cpuTemp: metrics.cpu_temp,
      gpuTemp: metrics.gpu_temp,
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
      cpuUsage: 0,
      cpuTemp: 0,
      gpuTemp: 0,
      ramUsedBytes: 0,
      ramTotalBytes: 16 * 1024 * 1024 * 1024,
      diskUsedBytes: 0,
      diskTotalBytes: 512 * 1024 * 1024 * 1024,
      netUpMbps: 0,
      netDownMbps: 0,
    };
  }
}
