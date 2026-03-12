import { isAxiosError } from 'axios';

import { ApiError, type ApiResponse } from '@/shared/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const list = value
      .map((item) => extractMessage(item))
      .filter((item): item is string => Boolean(item));
    return list.length > 0 ? list.join('; ') : null;
  }

  if (!isRecord(value)) return null;

  const directKeys = ['msg', 'message', 'error', 'detail', 'title'] as const;
  for (const key of directKeys) {
    const message = extractMessage(value[key]);
    if (message) return message;
  }

  if ('errors' in value) {
    const message = extractMessage(value.errors);
    if (message) return message;
  }

  return null;
}

function isGenericAxiosMessage(message: string): boolean {
  return /^Request failed with status code \d+$/.test(message) || message === 'Network Error';
}

function getFallbackMessage(status: number | undefined, code: string | undefined): string {
  if (status === 401) return '\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55';
  if (status === 403) return '\u6743\u9650\u4e0d\u8db3';
  if (status === 404) return '\u8d44\u6e90\u4e0d\u5b58\u5728';
  if (status === 422) return '\u8bf7\u6c42\u53c2\u6570\u6709\u8bef';
  if (typeof status === 'number' && status >= 500) {
    return '\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5';
  }
  if (code === 'ECONNABORTED') return '\u8bf7\u6c42\u8d85\u65f6\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u91cd\u8bd5';
  return '\u7f51\u7edc\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5';
}

type CancelLikeError = Error & { code?: string };

function createCanceledError(): CancelLikeError {
  const error = new Error('canceled') as CancelLikeError;
  error.name = 'CanceledError';
  error.code = 'ERR_CANCELED';
  return error;
}

export function isCanceledRequestError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';

  return (
    name === 'CanceledError' ||
    code === 'ERR_CANCELED' ||
    message.trim().toLowerCase() === 'canceled'
  );
}

export function normalizeBusinessError(data: unknown): ApiError | null {
  const payload = data as ApiResponse<unknown>;
  if (!payload || typeof payload !== 'object' || typeof payload.code !== 'number') return null;
  if (payload.code === 0) return null;

  const message =
    extractMessage(payload.msg) ??
    extractMessage(payload.data) ??
    `\u64cd\u4f5c\u672a\u6210\u529f\uff08\u9519\u8bef\u7801\uff1a${payload.code}\uff09`;

  return new ApiError(payload.code, message);
}

export function normalizeTransportError(error: unknown): ApiError | Error {
  if (isCanceledRequestError(error)) {
    return createCanceledError();
  }

  if (!isAxiosError(error)) {
    return error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
  }

  const status = error.response?.status;
  const responseData = error.response?.data;
  const serverMessage = extractMessage(responseData);
  const axiosMessage =
    typeof error.message === 'string' && !isGenericAxiosMessage(error.message)
      ? error.message.trim()
      : null;
  const statusText = extractMessage(error.response?.statusText);
  const message =
    serverMessage ??
    axiosMessage ??
    statusText ??
    getFallbackMessage(status, error.code);

  return new ApiError(status ?? 0, message);
}
