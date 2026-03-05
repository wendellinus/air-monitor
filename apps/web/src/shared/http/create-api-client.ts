import axios, { type AxiosInstance } from 'axios';

export function createApiClient(): AxiosInstance {
  return axios.create({
    baseURL: '/api/v1',
    timeout: 15_000,
  });
}

