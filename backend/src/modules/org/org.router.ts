import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireOrganizationRole } from '../../middleware/role.middleware.js';

export function orgRouter(): Router {
  const router = Router();

  router.post('/', requireAuth, async (req, res, next) => {
    try {
      const body = z.object({ name: z.string().min(2).max(100) }).parse(req.body);
      const org = await req.ctx.orgService.createOrganization({ actorUserId: req.auth!.id, name: body.name });
      return res.status(201).json({ organization: org });
    } catch (err) {
      return next(err);
    }
  });

  router.post(
    '/:orgId/teams',
    requireAuth,
    requireOrganizationRole({ param: 'orgId', anyOf: ['ORG_OWNER', 'ORG_ADMIN'] }),
    async (req, res, next) => {
      try {
        const params = z.object({ orgId: z.string().uuid() }).parse(req.params);
        const body = z.object({ name: z.string().min(2).max(100) }).parse(req.body);
        const team = await req.ctx.orgService.createTeam({
          actorUserId: req.auth!.id,
          organizationId: params.orgId,
          name: body.name
        });
        return res.status(201).json({ team });
      } catch (err) {
        return next(err);
      }
    }
  );

  router.post(
    '/:orgId/invitations',
    requireAuth,
    requireOrganizationRole({ param: 'orgId', anyOf: ['ORG_OWNER', 'ORG_ADMIN'] }),
    async (req, res, next) => {
      try {
        const params = z.object({ orgId: z.string().uuid() }).parse(req.params);
        const body = z
          .object({
            email: z.string().email(),
            roleName: z.enum(['ORG_OWNER', 'ORG_ADMIN', 'ORG_MEMBER', 'TEAM_ADMIN', 'TEAM_MEMBER']),
            teamId: z.string().uuid().optional().nullable()
          })
          .parse(req.body);

        const result = await req.ctx.orgService.inviteToOrganizationOrTeam({
          actorUserId: req.auth!.id,
          organizationId: params.orgId,
          email: body.email,
          roleName: body.roleName,
          teamId: body.teamId ?? null
        });

        return res.status(201).json({ ok: true, invitationToken: result.invitationToken });
      } catch (err) {
        return next(err);
      }
    }
  );

  return router;
}
