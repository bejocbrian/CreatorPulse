import cors from 'cors';
import express, { json } from 'express';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'api' });
  });

  app.get('/', (_req, res) => {
    res.status(200).json({ message: 'API is running' });
  });

  return app;
}
