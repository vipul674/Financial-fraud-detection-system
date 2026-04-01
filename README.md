# Financial Fraud Detection System

Monorepo for a financial fraud detection demo with:
- Frontend dashboard: React + Vite
- Backend API: Express + TypeScript
- Database: PostgreSQL + Drizzle ORM
- Package management: pnpm workspaces

## Prerequisites

- Node.js 24+
- pnpm 10+
- PostgreSQL 14+ (or Docker)

## Project Structure

- `artifacts/fraud-detection`: Frontend app
- `artifacts/api-server`: Backend API server
- `lib/db`: Database schema and connection
- `lib/api-zod`, `lib/api-client-react`: Generated API types/client

## 1. Install Dependencies

From the repo root:

```bash
pnpm install
```

## 2. Set Up PostgreSQL

You need a running PostgreSQL instance and a valid `DATABASE_URL`.

Example local connection string:

```bash
postgresql://postgres:postgres@localhost:5432/postgres
```

### Optional: Quick Postgres with Docker

```bash
docker run --name fraud-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres:16
```

## 3. Push Database Schema

From the repo root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres \
pnpm --filter @workspace/db run push
```

If push fails due to drift in a local test environment:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres \
pnpm --filter @workspace/db run push-force
```

## 4. Seed Mock Data (Transactions + Alerts)

This project includes a seed script that generates realistic mock transactions and related alerts.

From the repo root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres \
pnpm run seed:mock
```

Notes:
- The `seed:mock` command first runs a schema push (`drizzle-kit push`) to ensure required tables exist.
- The seed script resets previously seeded mock records before inserting fresh data.
- It creates transaction records first, then creates alerts for flagged/blocked transactions.

## 5. Run the Backend API

In terminal 1 (from repo root):

```bash
PORT=3000 \
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres \
pnpm --filter @workspace/api-server dev
```

Backend URL:
- `http://localhost:3000`
- Health check: `http://localhost:3000/api/healthz`

## 6. Run the Frontend

In terminal 2 (from repo root):

```bash
PORT=5173 \
BASE_PATH=/ \
pnpm --filter @workspace/fraud-detection dev
```

Frontend URL:
- `http://localhost:5173`

Dev proxy:
- Frontend `/api/*` requests are proxied to `http://localhost:3000`.
- If port `5173` is busy, Vite may move to `5174` (or another port), and proxying still works.

## Environment Variables

### Backend (`artifacts/api-server`)
- `PORT` (required)
- `DATABASE_URL` (required)

### Frontend (`artifacts/fraud-detection`)
- `PORT` (required)
- `BASE_PATH` (required; use `/` for local development)

## Useful Commands

Run full workspace typecheck:

```bash
pnpm run typecheck
```

Build all packages:

```bash
pnpm run build
```

## Troubleshooting

- Error: `PORT environment variable is required but was not provided.`
  - Set `PORT` for both backend and frontend commands.

- Error: `BASE_PATH environment variable is required but was not provided.`
  - Set `BASE_PATH=/` when starting the frontend.

- Error: `DATABASE_URL must be set. Did you forget to provision a database?`
  - Start PostgreSQL and pass a valid `DATABASE_URL`.

- API starts but frontend cannot fetch data:
  - Confirm backend is running on `http://localhost:3000`.
  - Verify health endpoint returns `{"status":"ok"}` at `/api/healthz`.
