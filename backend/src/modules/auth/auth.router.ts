import { Router } from 'express';
import { z } from 'zod';
import { badRequest } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const PasswordSchema = z.string().min(8).max(200);

function getClientIp(req: any): string | null {
  return (req.ip as string | undefined) ?? null;
}

function getUserAgent(req: any): string | null {
  const ua = req.get('user-agent');
  return ua ? String(ua) : null;
}

export function authRouter(): Router {
  const router = Router();

  router.post('/signup', async (req, res, next) => {
    try {
      const body = z
        .object({
          email: z.string().email(),
          password: PasswordSchema,
          name: z.string().trim().min(1).max(120).optional().nullable()
        })
        .parse(req.body);

      const result = await req.ctx.authService.signup({
        email: body.email,
        password: body.password,
        name: body.name ?? null,
        ip: getClientIp(req),
        userAgent: getUserAgent(req)
      });

      res.cookie(req.ctx.env.cookieNameRefreshToken, result.refreshToken, {
        httpOnly: true,
        secure: req.ctx.env.cookieSecure,
        sameSite: 'lax',
        maxAge: req.ctx.env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
        path: '/'
      });

      return res.status(201).json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          emailVerifiedAt: result.user.emailVerifiedAt
        },
        accessToken: result.accessToken,
        emailVerificationToken: result.emailVerificationToken
      });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const body = z
        .object({
          email: z.string().email(),
          password: PasswordSchema
        })
        .parse(req.body);

      const result = await req.ctx.authService.login({
        email: body.email,
        password: body.password,
        ip: getClientIp(req),
        userAgent: getUserAgent(req)
      });

      res.cookie(req.ctx.env.cookieNameRefreshToken, result.refreshToken, {
        httpOnly: true,
        secure: req.ctx.env.cookieSecure,
        sameSite: 'lax',
        maxAge: req.ctx.env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
        path: '/'
      });

      return res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          emailVerifiedAt: result.user.emailVerifiedAt
        },
        accessToken: result.accessToken
      });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.[req.ctx.env.cookieNameRefreshToken] ?? null;
      await req.ctx.authService.logout({
        refreshToken,
        ip: getClientIp(req),
        userAgent: getUserAgent(req)
      });

      res.clearCookie(req.ctx.env.cookieNameRefreshToken, { path: '/' });
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  });

  router.post('/refresh', async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.[req.ctx.env.cookieNameRefreshToken];
      if (!refreshToken) throw badRequest('Missing refresh token');

      const result = await req.ctx.authService.refresh({
        refreshToken,
        ip: getClientIp(req),
        userAgent: getUserAgent(req)
      });

      res.cookie(req.ctx.env.cookieNameRefreshToken, result.refreshToken, {
        httpOnly: true,
        secure: req.ctx.env.cookieSecure,
        sameSite: 'lax',
        maxAge: req.ctx.env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
        path: '/'
      });

      return res.json({ accessToken: result.accessToken });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/me', requireAuth, async (req, res, next) => {
    try {
      const user = await req.ctx.repo.findUserById(req.auth!.id);
      if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerifiedAt: user.emailVerifiedAt
        }
      });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/verify-email', async (req, res, next) => {
    try {
      const token =
        (typeof req.query?.token === 'string' ? req.query.token : undefined) ??
        z.object({ token: z.string().min(10) }).parse(req.body).token;

      await req.ctx.authService.verifyEmail({ token });
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  });

  router.post('/request-password-reset', async (req, res, next) => {
    try {
      const body = z.object({ email: z.string().email() }).parse(req.body);
      const result = await req.ctx.authService.requestPasswordReset({
        email: body.email,
        ip: getClientIp(req),
        userAgent: getUserAgent(req)
      });
      return res.json({ ok: true, passwordResetToken: result.passwordResetToken });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/reset-password', async (req, res, next) => {
    try {
      const body = z.object({ token: z.string().min(10), newPassword: PasswordSchema }).parse(req.body);
      await req.ctx.authService.resetPassword({ token: body.token, newPassword: body.newPassword });
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
