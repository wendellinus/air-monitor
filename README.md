# Monorepo (API + Web)

This repository is a pnpm workspace monorepo:

- `apps/api`: NestJS API (ported from legacy Go implementation)
- `apps/web`: React + Vite frontend (dashboard + admin)

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
cp apps/api/.env.example apps/api/.env
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

6) Start dev server(s)

```bash
pnpm dev:api
```

Frontend:

- Copy web env and set AMap key: `cp apps/web/.env.example apps/web/.env`
- Start web: `pnpm dev:web`

## Swagger

- Swagger UI: `http://localhost:8080/api/docs`

## Docs

- Beginner Guide (setup + full API list): `apps/api/docs/beginner-guide.md`
- Memory Anchor (short): `apps/api/docs/memory-anchor.md`

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
