import type { AxiosInstance } from 'axios';

import { ApiError } from '@/shared/types';
import { applyAuthInterceptor } from '@/shared/http/apply-auth-interceptor';
import { type ApiInternalRequestConfig } from '@/shared/http/api-request-config';
import {
  retryRequestAfterRefresh,
  shouldRefreshFromBusinessResponse,
  shouldRefreshFromTransportError,
} from '@/shared/http/auth-refresh';
import { createApiClient } from '@/shared/http/create-api-client';
import {
  isCanceledRequestError,
  normalizeBusinessError,
  normalizeTransportError,
} from '@/shared/http/error-normalizer';
import { reportUiError } from '@/shared/http/ui-error-reporter';

const UNAUTHORIZED_CODE = 40100;

function createConfiguredApiClient(): AxiosInstance {
  const client = createApiClient();

  applyAuthInterceptor(client);

  client.interceptors.response.use(
    async (response) => {
      if (shouldRefreshFromBusinessResponse(response)) {
        return retryRequestAfterRefresh(client, response.config);
      }

      const businessError = normalizeBusinessError(response.data);
      if (businessError) {
        throw businessError;
      }
      return response;
    },
    async (error: unknown) => {
      if (shouldRefreshFromTransportError(error)) {
        return retryRequestAfterRefresh(client, error.config);
      }

      const normalizedError = normalizeTransportError(error);
      const requestConfig =
        typeof error === 'object' && error !== null && 'config' in error
          ? (error.config as ApiInternalRequestConfig | undefined)
          : undefined;
      if (
        !requestConfig?.skipUiError &&
        !isCanceledRequestError(normalizedError) &&
        !(normalizedError instanceof ApiError && normalizedError.code === UNAUTHORIZED_CODE)
      ) {
        reportUiError(normalizedError);
      }
      return Promise.reject(normalizedError);
    },
  );

  return client;
}

export const api: AxiosInstance = createConfiguredApiClient();
