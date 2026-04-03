#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_ENV_FILE="$ROOT_DIR/apps/api/.env"
API_ENV_EXAMPLE_FILE="$ROOT_DIR/apps/api/.env.example"
WEB_ENV_FILE="$ROOT_DIR/apps/web/.env"
WEB_ENV_EXAMPLE_FILE="$ROOT_DIR/apps/web/.env.example"

log() {
  printf '\n[bootstrap] %s\n' "$1"
}

fail() {
  printf '\n[bootstrap] %s\n' "$1" >&2
  exit 1
}

ensure_file_from_example() {
  local file_path="$1"
  local example_path="$2"

  if [[ -f "$file_path" ]]; then
    return
  fi

  if [[ ! -f "$example_path" ]]; then
    fail "Missing required file: $file_path"
  fi

  cp "$example_path" "$file_path"

  local relative_path="$file_path"
  relative_path="${relative_path#$ROOT_DIR/}"
  log "Created $relative_path from example. Update it if you need custom credentials."
}

read_env_value() {
  local file_path="$1"
  local key="$2"

  awk -F= -v env_key="$key" '$1 == env_key { sub($1 "=", ""); print; exit }' "$file_path"
}

wait_for_postgres() {
  local db_user="$1"

  for attempt in $(seq 1 60); do
    if docker compose exec -T postgres pg_isready -U "$db_user" -d postgres >/dev/null 2>&1; then
      return
    fi

    sleep 1
  done

  fail "Postgres did not become ready within 60 seconds."
}

wait_for_redis() {
  for attempt in $(seq 1 30); do
    if docker compose exec -T redis redis-cli ping >/dev/null 2>&1; then
      return
    fi

    sleep 1
  done

  fail "Redis did not become ready within 30 seconds."
}

ensure_database_exists() {
  local db_user="$1"
  local db_name="$2"
  local exists

  exists="$(docker compose exec -T postgres psql -U "$db_user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$db_name';" | tr -d '[:space:]')"
  if [[ "$exists" == "1" ]]; then
    log "Database $db_name already exists."
    return
  fi

  log "Creating database $db_name ..."
  docker compose exec -T postgres psql -U "$db_user" -d postgres -c "CREATE DATABASE \"$db_name\";"
}

ensure_port_free() {
  local port="$1"

  if ! command -v lsof >/dev/null 2>&1; then
    return
  fi

  if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "Port $port is already in use. Stop the existing process or change PORT in apps/api/.env before starting the project."
  fi
}

main() {
  cd "$ROOT_DIR"

  command -v pnpm >/dev/null 2>&1 || fail "pnpm is required."
  command -v docker >/dev/null 2>&1 || fail "Docker is required."
  docker info >/dev/null 2>&1 || fail "Docker Desktop is not running or is not accessible."

  ensure_file_from_example "$API_ENV_FILE" "$API_ENV_EXAMPLE_FILE"
  ensure_file_from_example "$WEB_ENV_FILE" "$WEB_ENV_EXAMPLE_FILE"

  local database_url
  local api_port
  database_url="$(read_env_value "$API_ENV_FILE" "DATABASE_URL")"
  api_port="$(read_env_value "$API_ENV_FILE" "PORT")"

  [[ -n "$database_url" ]] || fail "DATABASE_URL is missing in apps/api/.env."
  api_port="${api_port:-8080}"

  local parsed
  local db_name
  local db_user
  parsed="$(DATABASE_URL="$database_url" node -e "const url = new URL(process.env.DATABASE_URL); const dbName = url.pathname.replace(/^\\//, ''); const dbUser = decodeURIComponent(url.username || 'postgres'); process.stdout.write(dbName + '|' + dbUser);")"
  IFS='|' read -r db_name db_user <<<"$parsed"

  [[ -n "$db_name" ]] || fail "Could not determine database name from DATABASE_URL."
  [[ -n "$db_user" ]] || fail "Could not determine database user from DATABASE_URL."

  log "Starting local infrastructure ..."
  pnpm dev:infra

  log "Waiting for Postgres ..."
  wait_for_postgres "$db_user"

  log "Waiting for Redis ..."
  wait_for_redis

  ensure_database_exists "$db_user" "$db_name"

  log "Generating Prisma client ..."
  pnpm prisma:generate

  log "Applying Prisma migrations ..."
  pnpm prisma:migrate:deploy

  log "Seeding initial accounts if configured ..."
  pnpm prisma:seed

  log "Building shared workspace package ..."
  pnpm --filter @air-monitor/shared build

  ensure_port_free "$api_port"

  log "Starting all dev servers ..."
  exec pnpm dev
}

main "$@"
