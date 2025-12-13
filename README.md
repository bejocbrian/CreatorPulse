# Frontend dashboard UI

## Frontend

This repository contains a React + TypeScript single-page app (Vite) for the dashboard UI.

### Requirements

- Node.js 18+

### Setup

```bash
npm install
```

### Environment

Create a `.env` file (or set env vars in your environment):

```bash
VITE_API_BASE_URL=http://localhost:3000
```

The app expects a JSON API and uses a bearer access token stored in `localStorage`.

### Run

```bash
npm run dev
```

### Tests

```bash
npm test
```

### App navigation

- `/login`, `/signup`, `/reset` – authentication flows
- `/dashboard` – active transactions + checklist progress
- `/documents` – document library (folder tree + upload + preview/annotations + sharing dialog)
- `/settings/subscription` – subscription status (Stripe)
- `/admin/users`, `/admin/analytics` – admin-only views

### API endpoints (expected)

These can be adjusted in `src/lib/api.ts` if your backend differs.

- `POST /auth/login` → `{ token, user }`
- `POST /auth/signup` → `{ token, user }`
- `POST /auth/reset/request` → `{ ok: true }`
- `POST /auth/reset/confirm` → `{ ok: true }`
- `GET /auth/me` → `user`

- `GET /transactions/active` → `Transaction[]`
- `GET /checklists/active` → `Checklist[]`

- `GET /documents/folders` → `DocumentFolder[]`
- `GET /documents?folderId=` → `DocumentFile[]`
- `POST /documents/upload` (multipart/form-data)
- `POST /documents/:id/annotations`
- `POST /documents/:id/share`

- `GET /billing/subscription` → `SubscriptionStatus`

- `GET /admin/users` → `User[]`
- `GET /admin/analytics` → `{ dailyActiveUsers: { date, count }[], storageBytesByDay: { date, bytes }[] }`
