#!/usr/bin/env bash

set -Eeuo pipefail

COMPOSE_FILE="compose.test.yml"
COMPOSE_PROJECT="transcendence-e2e"

TEST_DB_PORT=5436
DATABASE_URL="postgresql://test:test@127.0.0.1:${TEST_DB_PORT}/transcendence_test?schema=public"

export TEST_DB_PORT
export DATABASE_URL

cleanup() {
    echo "==> Stopping E2E test database"

    docker compose \
        -p "$COMPOSE_PROJECT" \
        -f "$COMPOSE_FILE" \
        down --volumes --remove-orphans
}

trap cleanup EXIT

echo "==> Starting E2E test database"

docker compose \
    -p "$COMPOSE_PROJECT" \
    -f "$COMPOSE_FILE" \
    up -d --wait postgres-test

echo "==> Applying Prisma migrations"

npx prisma migrate deploy

echo "==> Building application"

npm run build

echo "==> Running Playwright E2E tests"

npx playwright test

echo "==> E2E tests completed"
