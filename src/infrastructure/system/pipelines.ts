import type { PipelineStatus } from '../../domain/models/future';

const DEFAULT_PIPELINES: PipelineStatus[] = [
  { id: 'pipeline-main', name: 'Main Build', status: 'running', lastRun: new Date() },
  { id: 'pipeline-release', name: 'Release', status: 'stopped', lastRun: new Date(Date.now() - 3600_000) },
  { id: 'pipeline-tests', name: 'Tests', status: 'running', lastRun: new Date(Date.now() - 15 * 60_000) },
];

const STORAGE_KEY = 'thirdscreen.pipelines';

const readStoredPipelines = (): PipelineStatus[] | null => {
  if (typeof globalThis.window === 'undefined') return null;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const candidate = item as PipelineStatus & { lastRun?: string };
        if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') return null;
        if (candidate.status !== 'running' && candidate.status !== 'stopped' && candidate.status !== 'error') return null;
        return {
          id: candidate.id,
          name: candidate.name,
          status: candidate.status,
          lastRun: candidate.lastRun ? new Date(candidate.lastRun) : undefined,
        } as PipelineStatus;
      })
      .filter((item): item is PipelineStatus => item !== null);
  } catch {
    return null;
  }
};

export async function getPipelines(): Promise<PipelineStatus[]> {
  return readStoredPipelines() ?? DEFAULT_PIPELINES;
}
