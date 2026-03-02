import axios, { type AxiosInstance, isAxiosError } from 'axios';
import { toast } from 'sonner';

import { getAccessToken } from './auth';
import { ApiError, type ApiResponse } from './types';

export const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    const data = res.data as ApiResponse<unknown>;
    if (!data || typeof data !== 'object' || typeof data.code !== 'number') return res;
    if (data.code !== 0) {
      // 业务错误：由各组件 catch 后自行 toast，避免全局 + 组件双重提示
      throw new ApiError(data.code, data.msg || '请求失败');
    }
    return res;
  },
  (error: unknown) => {
    // 网络层 / HTTP 状态码错误
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const serverMsg = (error.response?.data as ApiResponse<unknown> | undefined)?.msg;
      const msg =
        serverMsg ??
        (status === 401
          ? '登录已过期，请重新登录'
          : status === 403
            ? '权限不足'
            : status === 404
              ? '资源不存在'
              : status === 422
                ? '请求参数有误'
                : status && status >= 500
                  ? '服务器内部错误，请稍后重试'
                  : error.code === 'ECONNABORTED'
                    ? '请求超时，请检查网络'
                    : '网络错误，请检查连接');
      toast.error(msg);
      return Promise.reject(new ApiError(status ?? 0, msg));
    }
    return Promise.reject(error as Error);
  },
);
