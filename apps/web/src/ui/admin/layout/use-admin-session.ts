import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { MePermissionsData, MeResponseData } from '@air-monitor/shared';

import { api } from '@/shared/api';
import { clearTokens } from '@/shared/auth';
import { useI18n } from '@/shared/i18n';
import type { Locale } from '@/shared/i18n';
import type { ApiResponse } from '@/shared/types';
import { useAdminSessionStore } from '@/ui/admin/stores/admin-session-store';

type AdminSessionState = {
  me: MeResponseData | null;
  permissionKeys: string[] | null;
  handleLogout: () => void;
};

function normalizeLocale(value: string): Locale {
  return value === 'en-US' ? 'en-US' : 'zh-CN';
}

export function useAdminSession(): AdminSessionState {
  const nav = useNavigate();
  const { t, setLocale } = useI18n();
  const me = useAdminSessionStore((state) => state.me);
  const permissionKeys = useAdminSessionStore((state) => state.permissionKeys);
  const setSession = useAdminSessionStore((state) => state.setSession);
  const clearSession = useAdminSessionStore((state) => state.clearSession);

  React.useEffect(() => {
    let mounted = true;
    const bootstrapSession = async (): Promise<void> => {
      try {
        const meRes = await api.get<ApiResponse<MeResponseData>>('/user/me');
        if (!mounted) return;
        const nextMe = meRes.data.data;
        setLocale(normalizeLocale(nextMe.locale));

        try {
          const permissionRes = await api.get<ApiResponse<MePermissionsData>>('/user/me/permissions');
          if (!mounted) return;
          setSession({ me: nextMe, permissionKeys: permissionRes.data.data.permissions });
        } catch {
          if (!mounted) return;
          setSession({ me: nextMe, permissionKeys: null });
        }
      } catch {
        // Keep persisted session if refresh bootstrap fails.
      }
    };
    void bootstrapSession();

    return () => {
      mounted = false;
    };
  }, [setLocale, setSession]);

  const handleLogout = React.useCallback(() => {
    const doLogout = async () => {
      try {
        await api.post('/logout');
      } catch {
        /* noop */
      }
      clearTokens();
      clearSession();
      nav('/admin/login', { replace: true });
      toast.success(t('admin.toast.logoutSuccess'));
    };
    void doLogout().catch(() => toast.error(t('admin.toast.logoutFail')));
  }, [clearSession, nav, t]);

  return { me, permissionKeys, handleLogout };
}
