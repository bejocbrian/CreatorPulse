import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { authRouter } from './modules/auth/auth.router.js';
import { invitationsRouter } from './modules/invitations/invitations.router.js';
import { orgRouter } from './modules/org/org.router.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { buildOpenApiSpec } from './openapi/spec.js';
import type { AppContext } from './types/context.js';

export function createApp(ctx: AppContext) {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use((req, _res, next) => {
    req.ctx = ctx;
    return next();
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));

  const spec = buildOpenApiSpec({ title: 'Auth Backend API', version: '0.1.0' });
  app.get('/openapi.json', (_req, res) => res.json(spec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

  app.use('/auth', authRouter());
  app.use('/orgs', orgRouter());
  app.use('/invitations', invitationsRouter());

  app.use(errorMiddleware);

  return app;
}
