# Documents Service API

Backend service for document management workflows (folders, documents with version history, checklists, sharing permissions, audit logs) with S3 signed upload/download URLs and e-signature placeholders.

## Development

- Install: `npm install`
- Run tests: `npm test`
- Start server: `npm start`

## Environment variables

- `PORT` (default: `3000`)
- `DATABASE_URL` (PostgreSQL connection string)
- `DB_MIGRATE_ON_START` (`true` to run SQL migrations on startup)

S3:
- `S3_REGION`
- `S3_BUCKET`
- `S3_MAX_SIZE_BYTES` (default: 26214400)
- `S3_ALLOWED_CONTENT_TYPES` (comma-separated; default: `application/pdf,image/jpeg,image/png`)

Webhooks:
- `DOCUSIGN_WEBHOOK_SECRET` (optional)

Authentication is via `X-User-Id` header (placeholder).
