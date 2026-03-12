import { toast } from 'sonner';

import { clearTokens } from '@/shared/auth';
import { useAdminSessionStore } from '@/ui/admin/stores/admin-session-store';

let lastExpiredToastAt = 0;

export function clearAuthSession(): void {
  clearTokens();
  useAdminSessionStore.getState().clearSession();
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/admin/login') return;
  window.location.replace('/admin/login');
}

export function handleExpiredAuth(message = '登录状态已失效，请重新登录'): void {
  clearAuthSession();

  const now = Date.now();
  if (now - lastExpiredToastAt > 1500) {
    lastExpiredToastAt = now;
    toast.error(message);
  }

  redirectToLogin();
}
