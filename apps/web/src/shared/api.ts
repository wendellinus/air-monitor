import axios, { type AxiosInstance } from 'axios';

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

api.interceptors.response.use((res) => {
  const data = res.data as ApiResponse<unknown>;
  if (!data || typeof data !== 'object' || typeof data.code !== 'number') return res;
  if (data.code !== 0) {
    throw new ApiError(data.code, data.msg || '请求失败');
  }
  return res;
});

