export type ApiResponse<T> = {
  code: number;
  msg: string;
  data: T;
};

