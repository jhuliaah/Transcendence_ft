_This project has been created as part of the 42 curriculum by ailbezer, jhualves, ratanaka and yvieira-_

# Transcendence

## Description

This project is a SvelteKit application with PostgreSQL persistence, user registration and login, and server-side sessions. The broader product scope and future features are still to be defined by the team.

**Implemented features:** Account registration, login and logout; protected dashboard; persistent sessions; and a database health endpoint.

## Instructions

### Prerequisites

- Node.js v24.21.0 (LTS) and npm v11.19.0.
- Docker Engine and Docker Compose v2 to run the containerized services.
- Git to clone the repository.

### Run in development

1. Clone the repository and open its directory.
2. Install the dependencies:

   ```sh
   make install
   ```

3. Start the development database, apply migrations, and start the development server:

   ```sh
   make dev
   ```

4. Open the URL printed by Vite in the terminal (usually `http://localhost:5173`).

`make dev` requires Docker and uses the PostgreSQL test database on `localhost:5434`. The database remains running after stopping the development server. The app reads and writes user and session data in this database.

Available authentication pages are `/cadastro` (registration), `/login`, and `/dashboard`. The dashboard redirects unauthenticated visitors to the login page. `POST /logout` revokes the current session, and `/health` checks the database connection.

### Run with Docker Compose

Compose starts the application, Nginx, and PostgreSQL. Create a local `.env` file from the provided template:

```sh
cp .env.example .env
```

The template contains local development credentials. Change these consistently in `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `DATABASE_URL` before use where needed, and do not commit real credentials. Start the services with:

```sh
make compose-up
```

The application will be available at `https://localhost`. Nginx generates a self-signed certificate for development, so the browser may show a security warning. Stop the services without removing database data with:

```sh
make compose-down
```

Apply the Prisma migrations to the Compose database before using the application:

```sh
docker compose --profile tools run --rm db-tools
```

### Useful commands

| Command                       | Description                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `make lint`                   | Run ESLint.                                                                                          |
| `make check`                  | Run Svelte and TypeScript checks.                                                                    |
| `make format-check`           | Check formatting with Prettier.                                                                      |
| `make test`                   | Run unit and component tests.                                                                        |
| `make test-integration`       | Run integration tests against a temporary PostgreSQL database (requires Docker).                     |
| `make test-e2e`               | Run browser end-to-end tests against a temporary PostgreSQL database (requires Docker and Chromium). |
| `make test-all`               | Run unit, integration, and end-to-end tests.                                                         |
| `make build`                  | Create the production build.                                                                         |
| `make verify`                 | Run formatting, lint, checks, all tests, and the production build.                                   |
| `make db-migrate name=<name>` | Create and apply a development Prisma migration with the given name.                                 |

Install the Playwright browser once before running end-to-end tests:

```sh
npx playwright install chromium
```

## Team Information

| Member (login) | Role(s)       | Responsibilities |
| -------------- | ------------- | ---------------- |
| _ailbezer_     | To be defined | To be defined.   |
| _jhualves_     | To be defined | To be defined.   |
| _ratanaka_     | To be defined | To be defined.   |
| _yvieira-_     | To be defined | To be defined.   |

## Project Management

- **Work organization:** To be defined (task distribution, meeting schedule, and tracking process).
- **Project management tools:** To be defined (for example, GitHub Issues or Trello).
- **Communication channels:** To be defined (for example, Discord or Slack).

## Technical Stack

| Area                | Technology                                                    | Usage and rationale                                                                                        |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Frontend            | Svelte 5, SvelteKit 3, TypeScript 6, and Vite 8               | Web application and user interface.                                                                        |
| Backend             | SvelteKit with Node.js 24 LTS (`node:24-alpine` in Docker)    | Server-side routes and authentication services, with the SvelteKit Node adapter.                           |
| Authentication      | Zod and Argon2                                                | Validate registration and login input; store passwords as Argon2id hashes and manage server-side sessions. |
| Database            | PostgreSQL 17 (`postgres:17-alpine` image) and Prisma 7       | Prisma schema, migrations, and a PostgreSQL adapter persist user and session data.                         |
| Infrastructure      | Docker Compose and Nginx                                      | Local service orchestration and HTTPS reverse proxy for the application.                                   |
| Testing and quality | Vitest, Testing Library, Playwright, ESLint, and svelte-check | Unit, integration, and browser end-to-end tests, linting, and static and type checks.                      |

## Database Schema

The Prisma schema defines the models used by authentication and the community data model.

- **User:** `id`, unique normalized `email`, Argon2id `passwordHash`, optional `name` and `avatarUrl`, and `createdAt`.
- **Session:** hashed token `id`, `userId`, and `expiresAt`; sessions last seven days and are deleted when their user is deleted.
- **OAuthAccount:** `id`, `provider`, `providerUserId`, and `userId`; provider identity pairs are unique, and accounts belong to a user. OAuth sign-in is not implemented.
- **Community:** `id`, `name`, optional `description`, `visibility` (`PUBLIC` or `PRIVATE`), and `joinPolicy` (`OPEN` or `APPROVAL`), with creation and update timestamps.
- **CommunityMembership:** links a user to a community with a `role` (`OWNER`, `ADMIN`, or `MEMBER`) and a `status` (`PENDING`, `ACTIVE`, `REJECTED`, or `REMOVED`). A user can have only one membership record per community. Deleting a community deletes its memberships; a user with memberships cannot be deleted.
- **Community flows:** The schema and migration are in place, but community creation, joining, and management are not implemented in the application yet.
- **Migrations:** Stored in `prisma/migrations` and applied with `npm run db:deploy`.
- **Development migrations:** Use `make db-migrate name=migration_name` to create and apply a migration against the development database.
- **Health check:** `GET /health` returns HTTP 200 when PostgreSQL is reachable and HTTP 503 otherwise.

## Features List

| Feature               | Description                                                               | Team member(s) | Status          |
| --------------------- | ------------------------------------------------------------------------- | -------------- | --------------- |
| User registration     | Validates input and stores unique accounts with Argon2id password hashes. | To be defined  | Implemented     |
| Login and sessions    | Authenticates users, persists seven-day sessions, and supports logout.    | To be defined  | Implemented     |
| Protected dashboard   | Requires an authenticated session to access the dashboard.                | To be defined  | Implemented     |
| Database health check | Reports whether the application can reach PostgreSQL.                     | To be defined  | Implemented     |
| Community data model  | Defines communities and memberships; application flows are future work.   | To be defined  | Schema only     |
| OAuth sign-in         | OAuth account schema is present; provider sign-in flows are future work.  | To be defined  | Not implemented |

## Modules

Modules have not yet been selected. Update this section once the project choices have been confirmed.

| Module        | Category       | Points                                            | Rationale and implementation | Team member(s) |
| ------------- | -------------- | ------------------------------------------------- | ---------------------------- | -------------- |
| To be defined | Major or Minor | To be defined (Major = 2 points; Minor = 1 point) | To be defined.               | To be defined  |

**Total points:** To be defined. Major modules are worth 2 points and Minor modules are worth 1 point.

## Individual Contributions

Describe each person's work, linking contributions to features, modules, or components and noting challenges and solutions.

| Member (login) | Specific contributions | Challenges and solutions |
| -------------- | ---------------------- | ------------------------ |
| _ailbezer_     | To be defined.         | To be defined.           |
| _jhualves_     | To be defined.         | To be defined.           |
| _ratanaka_     | To be defined.         | To be defined.           |
| _yvieira-_     | To be defined.         | To be defined.           |

## Resources

- [Svelte documentation](https://svelte.dev/docs)
- [SvelteKit documentation](https://svelte.dev/docs/kit)
- [TypeScript documentation](https://www.typescriptlang.org/docs/)
- [Node.js v24 documentation](https://nodejs.org/docs/latest-v24.x/api/)
- [PostgreSQL 17 documentation](https://www.postgresql.org/docs/17/)
- [Prisma documentation](https://www.prisma.io/docs)
- [Prisma PostgreSQL driver adapter](https://www.prisma.io/docs/orm/overview/databases/postgresql#using-the-node-postgres-driver)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [Nginx documentation](https://nginx.org/en/docs/)
- [Vite documentation](https://vite.dev/guide/)
- [Vitest documentation](https://vitest.dev/)
- [Testing Library documentation](https://testing-library.com/docs/)
- [ESLint documentation](https://eslint.org/docs/latest/)
- [Prettier documentation](https://prettier.io/docs/)

### AI Usage

For this version, AI was used to reorganize and write this README according to the activity requirements, based on the repository's existing configuration files. No application features were implemented with AI in this change. Document any future AI assistance here, including the tasks and project parts involved.

## License

To be defined.
