.DEFAULT_GOAL := help

NPM ?= npm
COMPOSE ?= docker compose

TEST_COMPOSE := compose.test.yml
TEST_DATABASE_URL := postgresql://test:test@localhost:5434/transcendence_test?schema=public

.PHONY: help install dev dev-db build preview lint check check-watch format-check test test-integration test-watch test-e2e test-all verify clean clean-deps compose-up compose-down compose-logs compose-ps

help: ## List available commands
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  make %-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies from package-lock.json
	$(NPM) ci

dev: dev-db ## Prepare test database and start Vite development server
	DATABASE_URL='$(TEST_DATABASE_URL)' $(NPM) run dev

dev-db: ## Start test PostgreSQL and apply pending migrations
	$(COMPOSE) -f $(TEST_COMPOSE) up -d --wait postgres-test
	DATABASE_URL='$(TEST_DATABASE_URL)' npx prisma migrate deploy

build: ## Build the production SSR application
	$(NPM) run build

preview: ## Preview the production build
	$(NPM) run preview

lint: ## Run ESLint
	$(NPM) run lint

check: ## Run Svelte and TypeScript checks
	$(NPM) run check

format-check: ## Check formatting with Prettier
	$(NPM) run format:check

check-watch: ## Run Svelte and TypeScript checks in watch mode
	$(NPM) run check:watch

test: ## Run the test suite once
	$(NPM) test

test-watch: ## Run Vitest in watch mode
	$(NPM) exec vitest

test-integration: ## Run integration tests with a temporary PostgreSQL database
	$(NPM) run test:integration

test-e2e: ## Run end-to-end tests
	$(NPM) run test:e2e

test-all: test test-integration test-e2e ## Run all automated tests

verify: format-check lint check test test-integration test-e2e build ## Run all quality checks, tests, and production build

clean: ## Remove generated build and framework output
	rm -rf .svelte-kit build .output .vercel .netlify .wrangler

clean-deps: ## Remove installed npm dependencies
	rm -rf node_modules

compose-up: ## Build and start app, Nginx, and PostgreSQL
	$(COMPOSE) up --build -d

compose-down: ## Stop Compose services without deleting database data
	$(COMPOSE) down

compose-logs: ## Follow Compose service logs
	$(COMPOSE) logs -f
