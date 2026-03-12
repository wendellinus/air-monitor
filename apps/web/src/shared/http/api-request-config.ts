import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

export type ApiRequestConfig = AxiosRequestConfig & {
  skipUiError?: boolean;
};

export type ApiInternalRequestConfig = InternalAxiosRequestConfig & {
  skipUiError?: boolean;
};

export const SILENT_UI_ERROR_REQUEST_CONFIG: ApiRequestConfig = {
  skipUiError: true,
};
