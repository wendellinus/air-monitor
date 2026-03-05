import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MeResponseData } from '@air-monitor/shared';

type AdminSessionState = {
  me: MeResponseData | null;
  permissionKeys: string[] | null;
  setSession: (payload: { me: MeResponseData | null; permissionKeys: string[] | null }) => void;
  setMe: (me: MeResponseData | null) => void;
  setPermissionKeys: (permissionKeys: string[] | null) => void;
  clearSession: () => void;
};

export const useAdminSessionStore = create<AdminSessionState>()(
  persist(
    (set) => ({
      me: null,
      permissionKeys: null,
      setSession: (payload) => set({ me: payload.me, permissionKeys: payload.permissionKeys }),
      setMe: (me) => set({ me }),
      setPermissionKeys: (permissionKeys) => set({ permissionKeys }),
      clearSession: () => set({ me: null, permissionKeys: null }),
    }),
    {
      name: 'admin-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        me: state.me,
        permissionKeys: state.permissionKeys,
      }),
    },
  ),
);
