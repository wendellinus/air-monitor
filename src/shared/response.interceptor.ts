import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        // Avoid double-wrapping.
        if (
          typeof data === 'object' &&
          data !== null &&
          'code' in data &&
          'msg' in data &&
          'data' in data
        ) {
          return data;
        }
        return { code: 0, msg: '成功', data: data ?? {} };
      }),
    );
  }
}
