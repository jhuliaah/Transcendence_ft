#!/usr/bin/env bash

set -Eeuo pipefail

COMPOSE_FILE="compose.test.yml"
COMPOSE_PROJECT="transcendence-test"

TEST_DB_PORT=5435
DATABASE_URL="postgresql://test:test@127.0.0.1:${TEST_DB_PORT}/transcendence_test?schema=public"

cleanup() {
    TEST_DB_PORT="$TEST_DB_PORT" docker compose \
        -p "$COMPOSE_PROJECT" \
        -f "$COMPOSE_FILE" \
        down --remove-orphans
}

trap cleanup EXIT

echo "==> Starting test database"
TEST_DB_PORT="$TEST_DB_PORT" docker compose \
    -p "$COMPOSE_PROJECT" \
    -f "$COMPOSE_FILE" \
    up -d --wait postgres-test

echo "==> Applying Prisma migrations"
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy

echo "==> Running integration tests"
DATABASE_URL="$DATABASE_URL" npx vitest run tests/integration

echo "==> Integration tests completed"
