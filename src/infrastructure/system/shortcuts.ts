import type { ShortcutItem } from '../../domain/models/future';

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: 'shortcut-docs', name: 'Docs', path: 'https://thirdscreen.local/docs' },
  { id: 'shortcut-project', name: 'Project', path: 'https://thirdscreen.local/project' },
  { id: 'shortcut-support', name: 'Support', path: 'https://thirdscreen.local/support' },
];

const STORAGE_KEY = 'thirdscreen.shortcuts';

const readStoredShortcuts = (): ShortcutItem[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((item): item is ShortcutItem => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.path === 'string'
      );
    });
  } catch {
    return null;
  }
};

export async function getShortcuts(): Promise<ShortcutItem[]> {
  return readStoredShortcuts() ?? DEFAULT_SHORTCUTS;
}
