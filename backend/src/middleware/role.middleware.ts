import type { RequestHandler } from 'express';
import { forbidden } from '../lib/errors.js';
import type { RoleName } from '../types/repositories.js';

export function requireOrganizationRole(options: { param: string; anyOf: RoleName[] }): RequestHandler {
  return async (req, _res, next) => {
    if (!req.auth) return next(forbidden());

    const organizationId = (req.params as any)[options.param] as string | undefined;
    if (!organizationId) return next(forbidden('Missing organization id'));

    try {
      const role = await req.ctx.repo.getOrganizationMemberRole({ organizationId, userId: req.auth.id });
      if (!role) return next(forbidden('Not a member of this organization'));
      if (!options.anyOf.includes(role.name)) return next(forbidden('Insufficient role'));
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
