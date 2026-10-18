_This project has been created as part of the 42 curriculum by ailbezer, jhualves, ratanaka and yvieira-_

# Transcendence

## Description

Its goals, functional scope, and key product features are still to be defined by the team. The repository contains a SvelteKit application, a PostgreSQL persistence foundation using Prisma, and a Docker Compose setup.

**Key features:** To be defined.

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

3. Start the development server:

   ```sh
   make dev
   ```

4. Open the URL printed by Vite in the terminal (usually `http://localhost:5173`).

Database configuration is not required just to start the development server. Database-backed endpoints, including `/health`, require a valid `DATABASE_URL`.

### Run with Docker Compose

Compose starts the application, Nginx, and PostgreSQL. Create a local `.env` file from the provided template:

```sh
cp .env.example .env
```

The template uses `postgres` as the development database user and password. Change these local credentials consistently in `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `DATABASE_URL` before use where needed, and do not commit real credentials. Then run:

```sh
make compose-up
```

The application will be available at `https://localhost`. Nginx generates a self-signed certificate for development, so the browser may show a security warning. Stop the services without removing database data with:

```sh
make compose-down
```

### Useful commands

| Command                 | Description                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `make lint`             | Run ESLint.                                                                         |
| `make check`            | Run Svelte and TypeScript checks.                                                   |
| `make format-check`     | Check formatting with Prettier.                                                     |
| `make test`             | Run the Vitest test suite.                                                          |
| `make test-integration` | Run integration tests against a temporary PostgreSQL database (requires Docker).    |
| `make build`            | Create the production build.                                                        |
| `make verify`           | Run formatting, lint, checks, unit and integration tests, and the production build. |

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

| Area                | Technology                                                 | Usage and rationale                                                                                                                    |
| ------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend            | Svelte 5, SvelteKit 3, TypeScript 6, and Vite 8            | Web application and user interface. Rationale: To be defined.                                                                          |
| Backend             | SvelteKit with Node.js 24 LTS (`node:24-alpine` in Docker) | The project is configured to build and run a SvelteKit application with the Node adapter. Endpoints and business logic: To be defined. |
| Database            | PostgreSQL 17 (`postgres:17-alpine` image) and Prisma 7    | Prisma schema, migrations, and a PostgreSQL adapter provide the initial persistence layer.                                             |
| Infrastructure      | Docker Compose and Nginx                                   | Local service orchestration and HTTPS reverse proxy for the application.                                                               |
| Testing and quality | Vitest, Testing Library, ESLint, and svelte-check          | Testing, linting, and static and type checks.                                                                                          |

## Database Schema

The initial Prisma schema defines the persistence models used as a foundation for user and authentication data. Authentication flows are not implemented yet.

- **User:** `id`, unique `email`, nullable `passwordHash`, `name`, and `avatarUrl`, and `createdAt`.
- **Session:** `id`, `userId`, and `expiresAt`; sessions belong to a user and are deleted when that user is deleted.
- **OAuthAccount:** `id`, `provider`, `providerUserId`, and `userId`; provider identity pairs are unique, and accounts belong to a user.
- **Migrations:** Stored in `prisma/migrations` and applied with `npm run db:deploy`.
- **Diagram:** To be added once the schema is established.

## Features List

| Feature                      | Description                                              | Team member(s) | Status                    |
| ---------------------------- | -------------------------------------------------------- | -------------- | ------------------------- |
| Initial application scaffold | SvelteKit starter page; it is not yet a product feature. | To be defined  | Present in the repository |
| Product features             | To be defined according to the project scope.            | To be defined  | Not implemented           |

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
