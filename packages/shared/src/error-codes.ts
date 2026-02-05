export const ErrorCodes = {
  ParamError: 10001,
  ServerBusy: 50000,
  ThirdParty: 50001,
  Unauthorized: 40100,
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

