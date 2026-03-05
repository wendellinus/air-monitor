import { isAxiosError } from 'axios';

import { ApiError, type ApiResponse } from '@/shared/types';

function getFallbackMessage(status: number | undefined, code: string | undefined): string {
  if (status === 401) return '登录已过期，请重新登录';
  if (status === 403) return '权限不足';
  if (status === 404) return '资源不存在';
  if (status === 422) return '请求参数有误';
  if (typeof status === 'number' && status >= 500) return '服务器内部错误，请稍后重试';
  if (code === 'ECONNABORTED') return '请求超时，请检查网络';
  return '网络错误，请检查连接';
}

export function normalizeBusinessError(data: unknown): ApiError | null {
  const payload = data as ApiResponse<unknown>;
  if (!payload || typeof payload !== 'object' || typeof payload.code !== 'number') return null;
  if (payload.code === 0) return null;
  return new ApiError(payload.code, payload.msg || '请求失败');
}

export function normalizeTransportError(error: unknown): ApiError | Error {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
  }

  const status = error.response?.status;
  const serverMsg = (error.response?.data as ApiResponse<unknown> | undefined)?.msg;
  const message = serverMsg ?? getFallbackMessage(status, error.code);
  return new ApiError(status ?? 0, message);
}
