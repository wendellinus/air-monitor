import type { AxiosInstance } from 'axios';

import { getAccessToken } from '@/shared/auth';

export function applyAuthInterceptor(api: AxiosInstance): void {
  api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

