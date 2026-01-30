# Repository Guidelines

## Project Structure & Module Organization
- `src/`: NestJS application source. Core business modules live in `src/modules/<domain>` (e.g., `user`, `city`, `air`, `notice`, `provider`, `ws`).
- `src/infra/`: cross-cutting infrastructure (Prisma, Redis cache, HTTP/QWeather client, logging, config).
- `src/shared/`: shared utilities (DTOs, guards, interceptors, constants, errors).
- `prisma/`: Prisma schema and migrations (`prisma/schema.prisma`).
- `configs/`: example configuration files; do not store secrets here.
- `docs/`: architecture and refactoring notes.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies.
- `pnpm start:dev`: run the API in watch mode for local development.
- `pnpm build`: compile to `dist/` for production.
- `pnpm start:prod`: run the compiled app.
- `pnpm lint` / `pnpm format`: enforce code style.
- `pnpm prisma migrate dev`: apply DB migrations locally.

## Coding Style & Naming Conventions
- TypeScript, 2-space indentation.
- Classes and modules use PascalCase (`UserService`), files use kebab-case (`user.service.ts`).
- DTOs end with `Dto`, Entities/Models end with `Entity` or `Model` (e.g., `UserEntity`).
- Keep controllers thin; move business logic into services and repositories.

## Testing Guidelines
- Unit tests use Jest; e2e tests live in `test/`.
- Name tests `*.spec.ts` and prefer one feature per file.
- Run `pnpm test`, `pnpm test:e2e`, and `pnpm test:cov` before PRs.

## Commit & Pull Request Guidelines
- Follow Conventional Commits observed in history: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- PRs should include: purpose, key changes, test evidence, and linked issue(s) if any.
- If API behavior changes, note it explicitly and update docs.

## Security & Configuration Tips
- Use `.env` for secrets; never commit real API keys or private keys.
- Postgres and Redis should be local or via `docker-compose.yml`.
- Keep JWT settings and QWeather credentials in environment variables.

## Agent-Specific Rules
- Use `pnpm` only; do not add other package managers.
- Keep API responses in the `{ code, msg, data }` shape and default to HTTP 200 for application errors.
- Preserve `/api/v1` routes and existing endpoint paths unless explicitly approved.
- Add new business logic in `src/modules/<domain>` and shared infra in `src/infra`; avoid cross-module imports except through public services.
- Use Prisma migrations for schema changes and update `prisma/schema.prisma` in the same change.
- Add or update tests for any new endpoint or behavior change.
- Enforce Controller-Service-Repository layering for all modules.
- Require DTOs for all inputs and validate with `class-validator`.
- Use constructor injection only; do not instantiate services with `new` inside classes.
- Use global `HttpException` handling; never return ad-hoc `{ status: 500 }` objects.
- Disallow `any`; every async function must return `Promise<T>` with a concrete type.
