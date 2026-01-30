# API (NestJS)

This repository contains a NestJS API. It replaces the previous Go implementation (moved to a separate branch).

## Requirements

- Node.js 18+ (recommended)
- pnpm
- Postgres 16+
- Redis 7+

## Quick Start

1) Start infra

```bash
docker compose up -d
```

2) Configure env

```bash
cp .env.example .env
```

3) Install deps and generate Prisma client

```bash
pnpm install
pnpm prisma:generate
```

4) Run DB migrations

```bash
pnpm prisma:migrate:dev
```

5) (Optional) Seed admin/operator (for production bootstrap)

```bash
pnpm prisma:seed
```

6) Start dev server

```bash
pnpm start:dev
```

## Swagger

- Swagger UI: `http://localhost:8080/api/docs`

## Docs

- Beginner Guide (setup + full API list): `docs/beginner-guide.md`
- Memory Anchor (short): `docs/memory-anchor.md`

## API Notes

- All responses follow `{ code, msg, data }`.
- Application errors still return HTTP 200 (business error codes in `code`).
- API prefix is `/api/v1` (e.g. `/api/v1/login`).

### Auth

- `POST /api/v1/register`
- `POST /api/v1/login` -> returns `{ token, refreshToken, user }`
- `POST /api/v1/refresh` -> returns `{ accessToken, refreshToken }`
- `POST /api/v1/logout` (Bearer token required)

### User

- `GET /api/v1/user/me` (Bearer token required)
- `GET /api/v1/users` (admin/operator only)
- `GET /api/v1/users/search` (admin/operator only)
