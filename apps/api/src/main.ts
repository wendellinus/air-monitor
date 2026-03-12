import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/http-exception.filter';
import { ResponseInterceptor } from './shared/response.interceptor';

function resolveStartupHint(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code?: unknown }).code ?? '');
    if (code === 'EADDRINUSE') {
      return 'Port 8080 is already in use. Another API dev process may already be running, or you can change `PORT` in `apps/api/.env` and keep the web proxy in sync.';
    }

    if (code === 'P1001') {
      return 'PostgreSQL is unavailable. Start local infrastructure first, for example `docker compose up -d postgres redis`, then rerun the API.';
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('ECONNREFUSED 127.0.0.1:6379')) {
    return 'Redis is unavailable. Start local infrastructure first, for example `docker compose up -d redis`, then rerun the API.';
  }

  return 'Check local infrastructure and environment variables, then rerun the API.';
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Keep all API routes under /api/v1.
  app.setGlobalPrefix('api/v1');

  // Use ws (not socket.io) so we can expose a plain WebSocket endpoint.
  app.useWebSocketAdapter(new WsAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port);
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  const message = error instanceof Error ? error.message : String(error);

  logger.error(`API startup failed. ${message}`);
  logger.error(resolveStartupHint(error));

  process.exit(1);
});
