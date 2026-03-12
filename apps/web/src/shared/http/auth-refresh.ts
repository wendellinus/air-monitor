import type {
  ApiResponse,
  RefreshRequest,
  RefreshResponseData,
} from '@air-monitor/shared';
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { getRefreshToken, setTokens } from '@/shared/auth';
import { handleExpiredAuth } from '@/shared/auth-session';
import { ApiError } from '@/shared/types';

import { createApiClient } from './create-api-client';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
  _skipAuthRefresh?: boolean;
};

const UNAUTHORIZED_CODE = 40100;

const refreshClient = createApiClient();

let refreshPromise: Promise<void> | null = null;

function isBusinessResponse(payload: unknown): payload is ApiResponse<unknown> {
  return (
    Boolean(payload) &&
    typeof payload === 'object' &&
    typeof (payload as ApiResponse<unknown>).code === 'number'
  );
}

function getBusinessMessage(payload: unknown): string {
  if (!isBusinessResponse(payload) || typeof payload.msg !== 'string') return '';
  return payload.msg;
}

function isUnauthorizedBusinessPayload(payload: unknown): boolean {
  if (!isBusinessResponse(payload) || payload.code !== UNAUTHORIZED_CODE) return false;
  return !getBusinessMessage(payload).includes('权限不足');
}

function shouldSkipRefresh(config?: RetryableRequestConfig): boolean {
  if (!config) return true;
  if (config._authRetry || config._skipAuthRefresh) return true;

  const url = `${config.url ?? ''}`;
  return url.includes('/login') || url.includes('/register') || url.includes('/refresh');
}

function ensureRefreshToken(): string {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(UNAUTHORIZED_CODE, '登录状态已失效，请重新登录');
  }
  return refreshToken;
}

async function refreshAccessToken(): Promise<void> {
  const refreshToken = ensureRefreshToken();
  const payload: RefreshRequest = { refreshToken };
  const config = { _skipAuthRefresh: true } as RetryableRequestConfig;
  const response = await refreshClient.post<ApiResponse<RefreshResponseData>>('/refresh', payload, config);

  if (!isBusinessResponse(response.data)) {
    throw new Error('刷新登录状态失败：响应格式不正确');
  }
  if (response.data.code !== 0) {
    throw new ApiError(response.data.code, response.data.msg || '登录状态已失效，请重新登录');
  }

  const nextTokens = response.data.data;
  if (!nextTokens?.accessToken || !nextTokens?.refreshToken) {
    throw new Error('刷新登录状态失败：缺少新的令牌');
  }

  setTokens({
    accessToken: nextTokens.accessToken,
    refreshToken: nextTokens.refreshToken,
  });
}

async function refreshAccessTokenOnce(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function retryRequestAfterRefresh(
  api: AxiosInstance,
  config?: RetryableRequestConfig,
  fallbackMessage?: string,
): Promise<AxiosResponse> {
  if (!config) {
    const error = new ApiError(UNAUTHORIZED_CODE, fallbackMessage || '登录状态已失效，请重新登录');
    handleExpiredAuth(error.message);
    throw error;
  }

  try {
    await refreshAccessTokenOnce();
  } catch (error) {
    const message = error instanceof Error ? error.message : fallbackMessage;
    handleExpiredAuth(message);
    throw error;
  }

  return api.request({
    ...config,
    _authRetry: true,
  } as RetryableRequestConfig);
}

export function shouldRefreshFromBusinessResponse(
  response: AxiosResponse<unknown>,
): response is AxiosResponse<ApiResponse<unknown>> {
  return (
    !shouldSkipRefresh(response.config as RetryableRequestConfig) &&
    isUnauthorizedBusinessPayload(response.data)
  );
}

export function shouldRefreshFromTransportError(error: unknown): error is AxiosError {
  if (!axios.isAxiosError(error)) return false;

  const config = error.config as RetryableRequestConfig | undefined;
  if (shouldSkipRefresh(config)) return false;

  const status = error.response?.status;
  if (status === 401) return true;
  return isUnauthorizedBusinessPayload(error.response?.data);
}
