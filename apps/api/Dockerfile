FROM node:20-alpine AS base

WORKDIR /app

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN pnpm config set store-dir /pnpm/store

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile --filter @acme/api...

FROM deps AS build

COPY tsconfig.base.json tsconfig.base.json
COPY apps/api apps/api

RUN pnpm --filter @acme/api build

FROM base AS prod

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile --prod --filter @acme/api...

COPY --from=build /app/apps/api/dist apps/api/dist

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
