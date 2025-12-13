# Acme Monorepo (React + Express)

A pnpm-workspaces monorepo that contains:

- **Frontend**: React + TypeScript (Vite) — `apps/web`
- **Backend**: Express + TypeScript — `apps/api`

It also includes shared tooling (ESLint, Prettier, base tsconfig, Vitest, Husky + lint-staged) and a Docker Compose stack with PostgreSQL + MinIO for local development parity.

## Repository layout

```text
.
├─ apps/
│  ├─ api/               # Express API (TypeScript)
│  └─ web/               # React app (TypeScript + Vite)
├─ docker-compose.yml    # postgres + minio (+ optional app profile)
├─ tsconfig.base.json    # shared TS defaults
├─ .eslintrc.cjs         # shared lint config
└─ .prettierrc.json      # shared formatting config
```

## Prerequisites

- Node.js **20+**
- pnpm (recommended via Corepack)
- Docker + Docker Compose (for postgres/minio/full stack)

Enable pnpm via Corepack:

```bash
corepack enable
```

## Setup

```bash
pnpm install
```

Copy env templates as needed:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## Development

Run both apps:

```bash
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000

### Health checks

- API: `GET /health` → `{ ok: true, service: "api" }`
- Web UI page: http://localhost:5173/health
- Web static health endpoint (Docker/Nginx): http://localhost:8080/healthz

## Infrastructure (Postgres + MinIO)

Bring up only infrastructure:

```bash
docker compose up -d postgres minio
```

Bring up the full stack (infra + api + web):

```bash
docker compose --profile app up --build
```

### Default local service ports

- Postgres: `localhost:5432` (user/password/db: `app`)
- MinIO S3 API: `localhost:9000`
- MinIO Console: `localhost:9001` (user: `minio`, password: `minio123`)
- API (Compose profile `app`): `localhost:3000`
- Web (Compose profile `app`): `localhost:8080`

## Quality

- Lint: `pnpm lint`
- Format check: `pnpm format`
- Typecheck: `pnpm typecheck`
- Tests: `pnpm test`
- CI aggregate (lint + typecheck + test): `pnpm run ci`

Git hooks:

- pre-commit runs `lint-staged`
- pre-push runs `pnpm run ci`
