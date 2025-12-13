import { Router } from 'express';
import { z } from 'zod';

export function invitationsRouter(): Router {
  const router = Router();

  router.post('/accept', async (req, res, next) => {
    try {
      const token = (typeof req.query?.token === 'string' ? req.query.token : undefined) ?? null;
      const body = z
        .object({
          token: z.string().min(10).optional(),
          name: z.string().trim().min(1).max(120).optional().nullable(),
          password: z.string().min(8).max(200).optional().nullable()
        })
        .parse(req.body ?? {});

      const finalToken = token ?? body.token;
      if (!finalToken) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing token' } });
      }

      const result = await req.ctx.orgService.acceptInvitation({
        token: finalToken,
        name: body.name ?? null,
        password: body.password ?? null
      });

      return res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          emailVerifiedAt: result.user.emailVerifiedAt
        },
        organizationId: result.organizationId,
        teamId: result.teamId
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
