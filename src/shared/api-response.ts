export type ApiOk<T> = {
  code: 0;
  msg: 'success';
  data: T;
};

export type ApiFail = {
  code: number;
  msg: string;
  data: Record<string, never>;
};

export type ApiResponse<T> = ApiOk<T> | ApiFail;

