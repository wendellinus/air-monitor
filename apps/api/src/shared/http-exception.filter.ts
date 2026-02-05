import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import { AppError } from './app-error';
import { ErrorCodes } from './error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // Default: always return HTTP 200 with business error codes.
    let code: number = ErrorCodes.ServerBusy;
    let msg = '服务器内部错误';

    if (exception instanceof AppError) {
      code = exception.code;
      msg = exception.message;
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const fallback = exception.message || '请求错误';

      // Map validation/auth errors into business codes.
      if (status === HttpStatus.BAD_REQUEST) {
        code = ErrorCodes.ParamError;
      } else if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        code = ErrorCodes.Unauthorized;
      }

      if (typeof response === 'string') {
        msg = response;
      } else if (typeof response === 'object' && response !== null) {
        const maybeMsg = (response as { message?: unknown }).message;
        const details = Array.isArray(maybeMsg) ? maybeMsg.join('; ') : String(maybeMsg ?? fallback);
        if (code === ErrorCodes.Unauthorized && details === 'Unauthorized') {
          msg = '未登录或登录已失效';
        } else if (code === ErrorCodes.ParamError) {
          msg = `参数错误：${details}`;
        } else {
          msg = details;
        }
      } else {
        msg = fallback;
      }
    } else if (exception instanceof Error) {
      msg = exception.message || msg;
    }

    // Keep logs Chinese (messages might still contain raw third-party errors).
    if (exception instanceof Error) {
      this.logger.error(`请求处理异常：code=${code} msg=${msg}`, exception.stack);
    } else {
      this.logger.error(`请求处理异常：code=${code} msg=${msg}`);
    }

    res.status(HttpStatus.OK).json({
      code,
      msg,
      data: {},
    });
  }
}
