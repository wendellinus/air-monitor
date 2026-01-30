import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';


import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps plain values', async () => {
    const interceptor = new ResponseInterceptor();
    const ctx = {} as ExecutionContext;
    const handler: CallHandler = { handle: () => of({ hello: 'world' }) };

    const result = await new Promise((resolve, reject) => {
      interceptor.intercept(ctx, handler).subscribe({ next: resolve, error: reject });
    });

    expect(result).toEqual({ code: 0, msg: '成功', data: { hello: 'world' } });
  });

  it('does not double-wrap pre-wrapped responses', async () => {
    const interceptor = new ResponseInterceptor();
    const ctx = {} as ExecutionContext;
    const handler: CallHandler = { handle: () => of({ code: 123, msg: 'x', data: {} }) };

    const result = await new Promise((resolve, reject) => {
      interceptor.intercept(ctx, handler).subscribe({ next: resolve, error: reject });
    });

    expect(result).toEqual({ code: 123, msg: 'x', data: {} });
  });
});
