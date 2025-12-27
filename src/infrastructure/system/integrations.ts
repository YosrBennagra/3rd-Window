import type { IntegrationStatus } from '../../domain/models/future';

const DEFAULT_INTEGRATIONS: IntegrationStatus[] = [
  { id: 'integration-github', name: 'GitHub', connected: true, lastSync: new Date() },
  { id: 'integration-slack', name: 'Slack', connected: false },
  { id: 'integration-notion', name: 'Notion', connected: true, lastSync: new Date(Date.now() - 2 * 60_000) },
];

const STORAGE_KEY = 'thirdscreen.integrations';

const readStoredIntegrations = (): IntegrationStatus[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const candidate = item as IntegrationStatus & { lastSync?: string };
        if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') return null;
        if (typeof candidate.connected !== 'boolean') return null;
        return {
          id: candidate.id,
          name: candidate.name,
          connected: candidate.connected,
          lastSync: candidate.lastSync ? new Date(candidate.lastSync) : undefined,
        } as IntegrationStatus;
      })
      .filter((item): item is IntegrationStatus => item !== null);
  } catch {
    return null;
  }
};

export async function getIntegrations(): Promise<IntegrationStatus[]> {
  return readStoredIntegrations() ?? DEFAULT_INTEGRATIONS;
}
