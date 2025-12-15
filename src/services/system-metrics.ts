// Placeholder for system metrics collection (CPU/GPU temp, RAM, disk, network).
export async function getSystemMetrics() {
  return {
    cpuTempC: 45,
    gpuTempC: 50,
    ramUsedBytes: 8 * 1024 * 1024 * 1024,
    ramTotalBytes: 16 * 1024 * 1024 * 1024,
    diskUsedBytes: 200 * 1024 * 1024 * 1024,
    diskTotalBytes: 512 * 1024 * 1024 * 1024,
    netUpMbps: 10,
    netDownMbps: 50
  };
}
