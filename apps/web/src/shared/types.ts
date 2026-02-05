export type { ApiResponse } from '@go-practice/shared';

export class ApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export type Tokens = { accessToken: string; refreshToken: string };
