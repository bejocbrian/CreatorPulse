const express = require('express');
const { ZodError } = require('zod');

const { isHttpError } = require('./errors');
const { authMiddleware } = require('./middleware/auth');

const { createFoldersRouter } = require('./routes/folders');
const { createDocumentsRouter } = require('./routes/documents');
const { createChecklistsRouter } = require('./routes/checklists');
const { createWebhooksRouter } = require('./routes/webhooks');

/**
 * @param {{ pool: import('pg').Pool, services: { s3: any }, config: any }} deps
 */
function createApp(deps) {
  const app = express();

  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/webhooks', createWebhooksRouter({ pool: deps.pool, config: deps.config }));

  app.use(authMiddleware);

  app.use('/folders', createFoldersRouter({ pool: deps.pool }));
  app.use('/documents', createDocumentsRouter({ pool: deps.pool, s3: deps.services.s3, config: deps.config }));
  app.use('/', createChecklistsRouter({ pool: deps.pool }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: { message: 'Validation error', details: err.flatten() } });
    }

    if (isHttpError(err)) {
      return res.status(err.status).json({ error: { message: err.message, details: err.details || null } });
    }

    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  });

  return app;
}

module.exports = {
  createApp,
};
