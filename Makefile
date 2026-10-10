.DEFAULT_GOAL := help

NPM ?= npm
COMPOSE ?= docker compose

.PHONY: help install dev build preview lint check check-watch test test-watch verify clean clean-deps compose-up compose-down compose-logs compose-ps

help: ## List available commands
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  make %-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies from package-lock.json
	$(NPM) ci

dev: ## Start the Vite development server
	$(NPM) run dev

build: ## Build the production SSR application
	$(NPM) run build

preview: ## Preview the production build
	$(NPM) run preview

lint: ## Run ESLint
	$(NPM) run lint

check: ## Run Svelte and TypeScript checks
	$(NPM) run check

check-watch: ## Run Svelte and TypeScript checks in watch mode
	$(NPM) run check:watch

test: ## Run the test suite once
	$(NPM) test

test-watch: ## Run Vitest in watch mode
	$(NPM) exec vitest

verify: lint check test build ## Run all quality checks and production build

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
