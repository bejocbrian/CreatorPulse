FROM node:20-alpine AS base

WORKDIR /app

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN pnpm config set store-dir /pnpm/store

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile --filter @acme/web...

FROM deps AS build

ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY tsconfig.base.json tsconfig.base.json
COPY apps/web apps/web

RUN pnpm --filter @acme/web build

FROM nginx:1.27-alpine AS prod

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
