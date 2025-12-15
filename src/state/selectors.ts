import { useAppStore } from './store';

export const useTheme = () => useAppStore((s) => s.theme);
