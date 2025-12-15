import { create } from 'zustand';

export interface AppState {
  theme: 'light' | 'dark' | 'auto';
  setTheme: (t: AppState['theme']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'auto',
  setTheme: (theme) => set({ theme })
}));
