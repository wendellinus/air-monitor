import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

function clampWidth(value: number): number {
  if (!Number.isFinite(value)) return 256;
  return Math.min(288, Math.max(232, Math.round(value)));
}

type UiShellState = {
  sidebarWidth: number;
  globalSearchOpen: boolean;
  setSidebarWidth: (next: number) => void;
  setGlobalSearchOpen: (open: boolean) => void;
};

export const useUiShellStore = create<UiShellState>()(
  persist(
    (set) => ({
      sidebarWidth: 256,
      globalSearchOpen: false,
      setSidebarWidth: (next) => set({ sidebarWidth: clampWidth(next) }),
      setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
    }),
    {
      name: 'admin-ui-shell',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
      }),
    },
  ),
);
