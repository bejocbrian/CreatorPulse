import type { RequestHandler } from 'express';
import { unauthorized } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return next(unauthorized());
  }

  const token = header.slice('bearer '.length).trim();

  try {
    const payload = verifyAccessToken(token, req.ctx.env.jwtAccessSecret);
    req.auth = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(unauthorized());
  }
};
