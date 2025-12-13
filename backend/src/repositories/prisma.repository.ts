import type { PrismaClient } from '@prisma/client';
import type {
  AuthRepository,
  CreateEmailVerificationTokenInput,
  CreateInvitationInput,
  CreateOrganizationInput,
  CreatePasswordResetTokenInput,
  CreateRefreshTokenInput,
  CreateTeamInput,
  CreateUserInput,
  RoleName,
  RoleScope
} from '../types/repositories.js';

const DEFAULT_ROLES: Array<{ name: RoleName; scope: RoleScope; description: string }> = [
  { name: 'ORG_OWNER', scope: 'ORGANIZATION', description: 'Organization owner' },
  { name: 'ORG_ADMIN', scope: 'ORGANIZATION', description: 'Organization admin' },
  { name: 'ORG_MEMBER', scope: 'ORGANIZATION', description: 'Organization member' },
  { name: 'TEAM_ADMIN', scope: 'TEAM', description: 'Team admin' },
  { name: 'TEAM_MEMBER', scope: 'TEAM', description: 'Team member' }
];

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async ensureDefaultRoles(): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const role of DEFAULT_ROLES) {
        const existing = await tx.role.findUnique({ where: { name: role.name } });
        if (!existing) {
          await tx.role.create({
            data: {
              name: role.name,
              scope: role.scope,
              description: role.description
            }
          });
        }
      }
    });
  }

  async getRoleByName(name: RoleName) {
    const role = await this.prisma.role.findUnique({ where: { name } });
    if (!role) return null;
    return { id: role.id, name: role.name as RoleName, scope: role.scope as RoleScope };
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) return null;
    return { id: role.id, name: role.name as RoleName, scope: role.scope as RoleScope };
  }

  async findUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async createUser(input: CreateUserInput) {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name ?? null,
        passwordHash: input.passwordHash
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async setUserEmailVerified(userId: string, verifiedAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: verifiedAt }
    });
  }

  async updateUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async createEmailVerificationToken(input: CreateEmailVerificationTokenInput) {
    const token = await this.prisma.emailVerificationToken.create({ data: input });
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt
    };
  }

  async consumeEmailVerificationToken(tokenHash: string, now: Date) {
    return this.prisma.$transaction(async (tx) => {
      const token = await tx.emailVerificationToken.findUnique({ where: { tokenHash } });
      if (!token || token.usedAt) return null;
      if (token.expiresAt <= now) return null;
      const updated = await tx.emailVerificationToken.update({
        where: { tokenHash },
        data: { usedAt: now }
      });
      return {
        id: updated.id,
        userId: updated.userId,
        tokenHash: updated.tokenHash,
        createdAt: updated.createdAt,
        expiresAt: updated.expiresAt,
        usedAt: updated.usedAt
      };
    });
  }

  async createPasswordResetToken(input: CreatePasswordResetTokenInput) {
    const token = await this.prisma.passwordResetToken.create({ data: input });
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt
    };
  }

  async consumePasswordResetToken(tokenHash: string, now: Date) {
    return this.prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
      if (!token || token.usedAt) return null;
      if (token.expiresAt <= now) return null;
      const updated = await tx.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: now } });
      return {
        id: updated.id,
        userId: updated.userId,
        tokenHash: updated.tokenHash,
        createdAt: updated.createdAt,
        expiresAt: updated.expiresAt,
        usedAt: updated.usedAt
      };
    });
  }

  async createRefreshToken(input: CreateRefreshTokenInput) {
    const token = await this.prisma.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        createdByIp: input.createdByIp ?? null,
        createdByUserAgent: input.createdByUserAgent ?? null
      }
    });
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      replacedByTokenId: token.replacedByTokenId,
      createdByIp: token.createdByIp,
      createdByUserAgent: token.createdByUserAgent,
      revokedByIp: token.revokedByIp,
      revokedByUserAgent: token.revokedByUserAgent
    };
  }

  async findRefreshTokenByHash(tokenHash: string) {
    const token = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!token) return null;
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      replacedByTokenId: token.replacedByTokenId,
      createdByIp: token.createdByIp,
      createdByUserAgent: token.createdByUserAgent,
      revokedByIp: token.revokedByIp,
      revokedByUserAgent: token.revokedByUserAgent
    };
  }

  async revokeRefreshToken(params: {
    id: string;
    revokedAt: Date;
    revokedByIp?: string | null;
    revokedByUserAgent?: string | null;
  }): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: params.id },
      data: {
        revokedAt: params.revokedAt,
        revokedByIp: params.revokedByIp ?? null,
        revokedByUserAgent: params.revokedByUserAgent ?? null
      }
    });
  }

  async rotateRefreshToken(params: {
    oldTokenId: string;
    newToken: CreateRefreshTokenInput;
    rotatedAt: Date;
    revokedByIp?: string | null;
    revokedByUserAgent?: string | null;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          userId: params.newToken.userId,
          tokenHash: params.newToken.tokenHash,
          expiresAt: params.newToken.expiresAt,
          createdByIp: params.newToken.createdByIp ?? null,
          createdByUserAgent: params.newToken.createdByUserAgent ?? null
        }
      });

      await tx.refreshToken.update({
        where: { id: params.oldTokenId },
        data: {
          revokedAt: params.rotatedAt,
          replacedByTokenId: created.id,
          revokedByIp: params.revokedByIp ?? null,
          revokedByUserAgent: params.revokedByUserAgent ?? null
        }
      });

      return {
        id: created.id,
        userId: created.userId,
        tokenHash: created.tokenHash,
        createdAt: created.createdAt,
        expiresAt: created.expiresAt,
        revokedAt: created.revokedAt,
        replacedByTokenId: created.replacedByTokenId,
        createdByIp: created.createdByIp,
        createdByUserAgent: created.createdByUserAgent,
        revokedByIp: created.revokedByIp,
        revokedByUserAgent: created.revokedByUserAgent
      };
    });
  }

  async revokeAllRefreshTokensForUser(userId: string, revokedAt: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt }
    });
  }

  async createOrganization(input: CreateOrganizationInput) {
    const org = await this.prisma.organization.create({ data: { name: input.name } });
    return {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    };
  }

  async addOrganizationMember(input: { organizationId: string; userId: string; roleId: string }) {
    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        roleId: input.roleId
      }
    });

    return {
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      roleId: member.roleId
    };
  }

  async getOrganizationMemberRole(params: { organizationId: string; userId: string }) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: params.organizationId, userId: params.userId } },
      include: { role: true }
    });
    if (!member) return null;
    return { id: member.role.id, name: member.role.name as RoleName, scope: member.role.scope as RoleScope };
  }

  async createTeam(input: CreateTeamInput) {
    const team = await this.prisma.team.create({
      data: { organizationId: input.organizationId, name: input.name }
    });
    return {
      id: team.id,
      organizationId: team.organizationId,
      name: team.name,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    };
  }

  async addTeamMember(input: { teamId: string; userId: string; roleId: string }) {
    const member = await this.prisma.teamMember.create({
      data: {
        teamId: input.teamId,
        userId: input.userId,
        roleId: input.roleId
      }
    });

    return {
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      roleId: member.roleId
    };
  }

  async getTeamMemberRole(params: { teamId: string; userId: string }) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: params.teamId, userId: params.userId } },
      include: { role: true }
    });

    if (!member) return null;
    return { id: member.role.id, name: member.role.name as RoleName, scope: member.role.scope as RoleScope };
  }

  async createInvitation(input: CreateInvitationInput) {
    const inv = await this.prisma.invitation.create({
      data: {
        email: input.email,
        organizationId: input.organizationId,
        teamId: input.teamId ?? null,
        roleId: input.roleId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        invitedById: input.invitedById ?? null
      }
    });

    return {
      id: inv.id,
      email: inv.email,
      organizationId: inv.organizationId,
      teamId: inv.teamId,
      roleId: inv.roleId,
      tokenHash: inv.tokenHash,
      status: inv.status,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      revokedAt: inv.revokedAt,
      createdAt: inv.createdAt,
      invitedById: inv.invitedById
    };
  }

  async findInvitationByTokenHash(tokenHash: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { tokenHash } });
    if (!inv) return null;
    return {
      id: inv.id,
      email: inv.email,
      organizationId: inv.organizationId,
      teamId: inv.teamId,
      roleId: inv.roleId,
      tokenHash: inv.tokenHash,
      status: inv.status,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      revokedAt: inv.revokedAt,
      createdAt: inv.createdAt,
      invitedById: inv.invitedById
    };
  }

  async acceptInvitation(params: { invitationId: string; acceptedAt: Date }): Promise<void> {
    await this.prisma.invitation.update({
      where: { id: params.invitationId },
      data: { status: 'ACCEPTED', acceptedAt: params.acceptedAt }
    });
  }

  async revokeInvitation(params: { invitationId: string; revokedAt: Date }): Promise<void> {
    await this.prisma.invitation.update({
      where: { id: params.invitationId },
      data: { status: 'REVOKED', revokedAt: params.revokedAt }
    });
  }
}
