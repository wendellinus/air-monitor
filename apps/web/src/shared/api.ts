import type { AxiosInstance } from 'axios';

import { applyAuthInterceptor } from '@/shared/http/apply-auth-interceptor';
import { createApiClient } from '@/shared/http/create-api-client';
import { normalizeBusinessError, normalizeTransportError } from '@/shared/http/error-normalizer';
import { reportUiError } from '@/shared/http/ui-error-reporter';

function createConfiguredApiClient(): AxiosInstance {
  const client = createApiClient();

  applyAuthInterceptor(client);

  client.interceptors.response.use(
    (response) => {
      const businessError = normalizeBusinessError(response.data);
      if (businessError) {
        throw businessError;
      }
      return response;
    },
    (error: unknown) => {
      const normalizedError = normalizeTransportError(error);
      reportUiError(normalizedError);
      return Promise.reject(normalizedError);
    },
  );

  return client;
}

export const api: AxiosInstance = createConfiguredApiClient();
