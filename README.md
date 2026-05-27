# Task Manager API

REST API for task management built with NestJS, PostgreSQL, and Prisma ORM.

## Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL + Prisma ORM 5
- **Auth**: JWT (passport-jwt) + bcrypt
- **Docs**: Swagger UI (development only)

## Quick start with Docker (recommended)

The fastest way to get the API running locally — no Node, no Postgres install required, just Docker.

```bash
# 1. Copy environment file
cp .env.docker.example .env

# 2. Build images and start the stack (API + Postgres)
docker compose up -d --build

# 3. Tail logs
docker compose logs -f api
```

The container automatically runs `prisma migrate deploy` on startup, so the database schema is ready as soon as the API is up.

- API:        http://localhost:3000/api
- Swagger:    http://localhost:3000/api/docs
- Health:     http://localhost:3000/api/health

### Common Docker commands

```bash
docker compose down              # stop containers
docker compose down -v           # stop and wipe the database volume
docker compose restart api       # restart just the API
docker compose exec api sh       # shell into the API container
docker compose exec postgres psql -U postgres infopoly   # open psql
```

## Local development (without Docker)

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables (separate from Docker — use .env.example, not .env.docker.example)
cp .env.example .env
# Edit .env — set DATABASE_URL for your PostgreSQL and JWT_SECRET (min 32 chars)

# Run database migrations
npm run db:migrate

# Start in development mode
npm run start:dev
```

Swagger UI is available at `http://localhost:3000/api/docs`.

### Code quality (before push)

After `npm install`, [Husky](https://typicode.github.io/husky/) runs ESLint and Prettier on **pre-push**:

```bash
npm run lint:check    # ESLint without auto-fix
npm run format:check  # Prettier check only
npm run lint          # ESLint with --fix (local fixes)
npm run format        # Prettier write
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✓ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✓ | — | Secret key, min 32 characters |
| `JWT_EXPIRES_IN` | — | `7d` | Token lifetime (ms format) |
| `PORT` | — | `3000` | HTTP port |
| `NODE_ENV` | — | `development` | `development` / `production` / `test` |

## API

### Authentication

```
POST /api/auth/register   — create account, returns { accessToken }
POST /api/auth/login      — returns { accessToken }
```

All other endpoints require `Authorization: Bearer <token>`.

### Projects

```
GET    /api/projects          — list your projects
POST   /api/projects          — create project
GET    /api/projects/:id      — get project
PATCH  /api/projects/:id      — update project
DELETE /api/projects/:id      — delete project (cascades tasks)
```

Project names are unique per user.

### Tasks

```
GET    /api/projects/:projectId/tasks          — list tasks
POST   /api/projects/:projectId/tasks          — create task
GET    /api/projects/:projectId/tasks/:id      — get task
PATCH  /api/projects/:projectId/tasks/:id      — update task
DELETE /api/projects/:projectId/tasks/:id      — delete task
```

#### Task list query params

| Param | Values | Description |
|---|---|---|
| `status` | `todo` / `in_progress` / `done` | Filter by status |
| `priority` | `low` / `medium` / `high` | Filter by priority |
| `sortBy` | `createdAt` / `dueDate` / `priority` | Sort field |
| `order` | `asc` / `desc` | Sort direction |

All params are optional and composable.

## Example requests

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Password1"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Password1"}' | jq -r .accessToken)

# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"My Project"}'

# Create task
curl -X POST http://localhost:3000/api/projects/1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Design schema","priority":"high","dueDate":"2025-12-31T00:00:00.000Z"}'

# Filter tasks
curl "http://localhost:3000/api/projects/1/tasks?status=todo&priority=high&sortBy=dueDate&order=asc" \
  -H "Authorization: Bearer $TOKEN"
```
