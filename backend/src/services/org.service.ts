import { z } from 'zod';
import type { AppEnv } from '../config/env.js';
import { randomToken, sha256 } from '../lib/crypto.js';
import { badRequest, forbidden, unauthorized } from '../lib/errors.js';
import { hashPassword } from '../lib/password.js';
import type { EmailService } from '../types/email.js';
import type { AuthRepository, RoleName, User } from '../types/repositories.js';

const OrgNameSchema = z.string().trim().min(2).max(100);
const EmailSchema = z.string().email();

export class OrgService {
  constructor(
    private readonly deps: {
      env: AppEnv;
      repo: AuthRepository;
      email: EmailService;
    }
  ) {}

  async createOrganization(params: { actorUserId: string; name: string }) {
    const name = OrgNameSchema.parse(params.name);

    const role = await this.deps.repo.getRoleByName('ORG_OWNER');
    if (!role) throw new Error('Default roles not seeded');

    const org = await this.deps.repo.createOrganization({ name });
    await this.deps.repo.addOrganizationMember({ organizationId: org.id, userId: params.actorUserId, roleId: role.id });

    return org;
  }

  async createTeam(params: { actorUserId: string; organizationId: string; name: string }) {
    const name = OrgNameSchema.parse(params.name);

    const actorRole = await this.deps.repo.getOrganizationMemberRole({
      organizationId: params.organizationId,
      userId: params.actorUserId
    });

    if (!actorRole) throw forbidden('Not a member of this organization');
    if (actorRole.name !== 'ORG_OWNER' && actorRole.name !== 'ORG_ADMIN') {
      throw forbidden('Insufficient role');
    }

    return this.deps.repo.createTeam({ organizationId: params.organizationId, name });
  }

  async inviteToOrganizationOrTeam(params: {
    actorUserId: string;
    organizationId: string;
    email: string;
    roleName: RoleName;
    teamId?: string | null;
  }): Promise<{ invitationToken?: string }> {
    const email = EmailSchema.parse(params.email).toLowerCase();

    const actorRole = await this.deps.repo.getOrganizationMemberRole({
      organizationId: params.organizationId,
      userId: params.actorUserId
    });

    if (!actorRole) throw forbidden('Not a member of this organization');
    if (actorRole.name !== 'ORG_OWNER' && actorRole.name !== 'ORG_ADMIN') {
      throw forbidden('Insufficient role');
    }

    const role = await this.deps.repo.getRoleByName(params.roleName);
    if (!role) throw badRequest('Unknown role');

    if (params.teamId && role.scope !== 'TEAM') {
      throw badRequest('Role scope mismatch (expected TEAM role)');
    }
    if (!params.teamId && role.scope !== 'ORGANIZATION') {
      throw badRequest('Role scope mismatch (expected ORGANIZATION role)');
    }

    const rawInviteToken = randomToken(32);
    const inviteHash = sha256(rawInviteToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.deps.repo.createInvitation({
      email,
      organizationId: params.organizationId,
      teamId: params.teamId ?? null,
      roleId: role.id,
      tokenHash: inviteHash,
      expiresAt,
      invitedById: params.actorUserId
    });

    const inviteUrl = new URL('/invitations/accept', this.deps.env.appBaseUrl);
    inviteUrl.searchParams.set('token', rawInviteToken);

    await this.deps.email.sendInvitation({ to: email, inviteUrl: inviteUrl.toString() });

    return { invitationToken: this.deps.env.exposeEmailTokensInResponse ? rawInviteToken : undefined };
  }

  async acceptInvitation(params: {
    token: string;
    name?: string | null;
    password?: string | null;
  }): Promise<{ user: User; organizationId: string; teamId: string | null }> {
    const now = new Date();
    const tokenHash = sha256(params.token);

    const invitation = await this.deps.repo.findInvitationByTokenHash(tokenHash);
    if (!invitation) throw unauthorized('Invalid invitation token');

    if (invitation.status !== 'PENDING' || invitation.revokedAt || invitation.acceptedAt) {
      throw unauthorized('Invitation is not active');
    }

    if (invitation.expiresAt <= now) {
      await this.deps.repo.revokeInvitation({ invitationId: invitation.id, revokedAt: now });
      throw unauthorized('Invitation expired');
    }

    let user = await this.deps.repo.findUserByEmail(invitation.email);

    if (!user) {
      if (!params.password) throw badRequest('Password is required to accept invitation');

      user = await this.deps.repo.createUser({
        email: invitation.email,
        name: params.name ?? null,
        passwordHash: await hashPassword(params.password)
      });

      const rawVerifyToken = randomToken(32);
      await this.deps.repo.createEmailVerificationToken({
        userId: user.id,
        tokenHash: sha256(rawVerifyToken),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      });

      const verifyUrl = new URL('/auth/verify-email', this.deps.env.appBaseUrl);
      verifyUrl.searchParams.set('token', rawVerifyToken);
      await this.deps.email.sendEmailVerification({ to: user.email, verifyUrl: verifyUrl.toString() });
    }

    const role = await this.deps.repo.getRoleById(invitation.roleId);
    if (!role) throw unauthorized('Invitation role missing');

    const existingOrgRole = await this.deps.repo.getOrganizationMemberRole({
      organizationId: invitation.organizationId,
      userId: user.id
    });

    if (!existingOrgRole) {
      const orgRole = role.scope === 'ORGANIZATION' ? role : await this.deps.repo.getRoleByName('ORG_MEMBER');
      if (!orgRole) throw new Error('Default roles not seeded');

      await this.deps.repo.addOrganizationMember({
        organizationId: invitation.organizationId,
        userId: user.id,
        roleId: orgRole.id
      });
    }

    if (invitation.teamId) {
      const existingTeamRole = await this.deps.repo.getTeamMemberRole({ teamId: invitation.teamId, userId: user.id });
      if (!existingTeamRole) {
        if (role.scope !== 'TEAM') throw unauthorized('Invitation role scope mismatch');
        await this.deps.repo.addTeamMember({ teamId: invitation.teamId, userId: user.id, roleId: role.id });
      }
    }

    await this.deps.repo.acceptInvitation({ invitationId: invitation.id, acceptedAt: now });

    return { user, organizationId: invitation.organizationId, teamId: invitation.teamId };
  }
}
