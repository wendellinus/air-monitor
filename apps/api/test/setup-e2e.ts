// Jest "setupFiles" runs before test files are imported.
// Keep env defaults here so Prisma/Nest can boot in e2e.

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

process.env.PORT = process.env.PORT ?? '0';

// Local defaults (match docker-compose.yml)
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:123456@127.0.0.1:5432/air_monitor?schema=public&sslmode=disable';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379/0';

// JWT (tests should not rely on your real secrets)
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'e2e_access_secret_change_me';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'e2e_refresh_secret_change_me';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

// Disable background jobs in tests to keep deterministic.
process.env.CACHE_REFRESH_ENABLED = 'false';
process.env.ALERT_SYNC_ENABLED = 'false';
