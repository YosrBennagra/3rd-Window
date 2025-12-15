// Placeholder MCP server for system metrics.
export async function listMetrics() {
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
