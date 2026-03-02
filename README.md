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

1. Start infra

```bash
docker compose up -d
```

2. Configure env

```bash
cp apps/api/.env.example apps/api/.env
# 编辑 apps/api/.env，填写初始账号等配置
```

3. Install deps（自动生成 Prisma Client）

```bash
pnpm install
```

4. Run DB migrations + seed

```bash
pnpm run setup
```

> `setup` = `prisma migrate dev`，会自动建表并执行 seed 初始化账号。

5. Start dev server(s)

```bash
pnpm dev
```

Frontend（可选）：

- `cp apps/web/.env.example apps/web/.env`（设置 AMap key 等）
- 单独启动 web：`pnpm dev:web`

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
