import crypto from 'node:crypto';
import type {
  AuthRepository,
  CreateEmailVerificationTokenInput,
  CreateInvitationInput,
  CreateOrganizationInput,
  CreatePasswordResetTokenInput,
  CreateRefreshTokenInput,
  CreateTeamInput,
  CreateUserInput,
  EmailVerificationToken,
  Invitation,
  Organization,
  OrganizationMember,
  PasswordResetToken,
  RefreshToken,
  Role,
  RoleName,
  Team,
  TeamMember
} from '../../src/types/repositories.js';

function uuid(): string {
  return crypto.randomUUID();
}

const DEFAULT_ROLES: Role[] = [
  { id: 'role-org-owner', name: 'ORG_OWNER', scope: 'ORGANIZATION' },
  { id: 'role-org-admin', name: 'ORG_ADMIN', scope: 'ORGANIZATION' },
  { id: 'role-org-member', name: 'ORG_MEMBER', scope: 'ORGANIZATION' },
  { id: 'role-team-admin', name: 'TEAM_ADMIN', scope: 'TEAM' },
  { id: 'role-team-member', name: 'TEAM_MEMBER', scope: 'TEAM' }
];

export class InMemoryAuthRepository implements AuthRepository {
  private roles = new Map<string, Role>();
  private users = new Map<string, any>();
  private usersByEmail = new Map<string, string>();

  private emailVerificationTokens = new Map<string, EmailVerificationToken>();
  private passwordResetTokens = new Map<string, PasswordResetToken>();
  private refreshTokens = new Map<string, RefreshToken>();
  private refreshTokensByHash = new Map<string, string>();

  private orgs = new Map<string, Organization>();
  private orgMembers = new Map<string, OrganizationMember>();
  private teams = new Map<string, Team>();
  private teamMembers = new Map<string, TeamMember>();
  private invitations = new Map<string, Invitation>();
  private invitationsByHash = new Map<string, string>();

  async ensureDefaultRoles(): Promise<void> {
    for (const role of DEFAULT_ROLES) {
      this.roles.set(role.id, role);
    }
  }

  async getRoleByName(name: RoleName): Promise<Role | null> {
    for (const role of this.roles.values()) {
      if (role.name === name) return role;
    }
    return null;
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.roles.get(id) ?? null;
  }

  async findUserByEmail(email: string) {
    const id = this.usersByEmail.get(email);
    if (!id) return null;
    return this.users.get(id) ?? null;
  }

  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }

  async createUser(input: CreateUserInput) {
    const id = uuid();
    const now = new Date();
    const user = {
      id,
      email: input.email,
      name: input.name ?? null,
      passwordHash: input.passwordHash,
      emailVerifiedAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    this.usersByEmail.set(input.email, id);
    return user;
  }

  async setUserEmailVerified(userId: string, verifiedAt: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.emailVerifiedAt = verifiedAt;
      user.updatedAt = new Date();
    }
  }

  async updateUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
    }
  }

  async createEmailVerificationToken(input: CreateEmailVerificationTokenInput) {
    const token: EmailVerificationToken = {
      id: uuid(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      createdAt: new Date(),
      expiresAt: input.expiresAt,
      usedAt: null
    };
    this.emailVerificationTokens.set(token.tokenHash, token);
    return token;
  }

  async consumeEmailVerificationToken(tokenHash: string, now: Date) {
    const token = this.emailVerificationTokens.get(tokenHash);
    if (!token || token.usedAt) return null;
    if (token.expiresAt <= now) return null;
    token.usedAt = now;
    return token;
  }

  async createPasswordResetToken(input: CreatePasswordResetTokenInput) {
    const token: PasswordResetToken = {
      id: uuid(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      createdAt: new Date(),
      expiresAt: input.expiresAt,
      usedAt: null
    };
    this.passwordResetTokens.set(token.tokenHash, token);
    return token;
  }

  async consumePasswordResetToken(tokenHash: string, now: Date) {
    const token = this.passwordResetTokens.get(tokenHash);
    if (!token || token.usedAt) return null;
    if (token.expiresAt <= now) return null;
    token.usedAt = now;
    return token;
  }

  async createRefreshToken(input: CreateRefreshTokenInput) {
    const token: RefreshToken = {
      id: uuid(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      createdAt: new Date(),
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
      createdByIp: input.createdByIp ?? null,
      createdByUserAgent: input.createdByUserAgent ?? null,
      revokedByIp: null,
      revokedByUserAgent: null
    };
    this.refreshTokens.set(token.id, token);
    this.refreshTokensByHash.set(token.tokenHash, token.id);
    return token;
  }

  async findRefreshTokenByHash(tokenHash: string) {
    const id = this.refreshTokensByHash.get(tokenHash);
    if (!id) return null;
    return this.refreshTokens.get(id) ?? null;
  }

  async revokeRefreshToken(params: {
    id: string;
    revokedAt: Date;
    revokedByIp?: string | null;
    revokedByUserAgent?: string | null;
  }): Promise<void> {
    const token = this.refreshTokens.get(params.id);
    if (token) {
      token.revokedAt = params.revokedAt;
      token.revokedByIp = params.revokedByIp ?? null;
      token.revokedByUserAgent = params.revokedByUserAgent ?? null;
    }
  }

  async rotateRefreshToken(params: {
    oldTokenId: string;
    newToken: CreateRefreshTokenInput;
    rotatedAt: Date;
    revokedByIp?: string | null;
    revokedByUserAgent?: string | null;
  }) {
    const newTok = await this.createRefreshToken(params.newToken);
    await this.revokeRefreshToken({
      id: params.oldTokenId,
      revokedAt: params.rotatedAt,
      revokedByIp: params.revokedByIp,
      revokedByUserAgent: params.revokedByUserAgent
    });
    const old = this.refreshTokens.get(params.oldTokenId);
    if (old) old.replacedByTokenId = newTok.id;
    return newTok;
  }

  async revokeAllRefreshTokensForUser(userId: string, revokedAt: Date): Promise<void> {
    for (const tok of this.refreshTokens.values()) {
      if (tok.userId === userId && !tok.revokedAt) {
        tok.revokedAt = revokedAt;
      }
    }
  }

  async createOrganization(input: CreateOrganizationInput) {
    const org: Organization = {
      id: uuid(),
      name: input.name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orgs.set(org.id, org);
    return org;
  }

  async addOrganizationMember(input: { organizationId: string; userId: string; roleId: string }) {
    const member: OrganizationMember = { id: uuid(), ...input };
    this.orgMembers.set(member.id, member);
    return member;
  }

  async getOrganizationMemberRole(params: { organizationId: string; userId: string }) {
    for (const member of this.orgMembers.values()) {
      if (member.organizationId === params.organizationId && member.userId === params.userId) {
        return this.roles.get(member.roleId) ?? null;
      }
    }
    return null;
  }

  async createTeam(input: CreateTeamInput) {
    const team: Team = {
      id: uuid(),
      organizationId: input.organizationId,
      name: input.name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.teams.set(team.id, team);
    return team;
  }

  async addTeamMember(input: { teamId: string; userId: string; roleId: string }) {
    const member: TeamMember = { id: uuid(), ...input };
    this.teamMembers.set(member.id, member);
    return member;
  }

  async getTeamMemberRole(params: { teamId: string; userId: string }) {
    for (const member of this.teamMembers.values()) {
      if (member.teamId === params.teamId && member.userId === params.userId) {
        return this.roles.get(member.roleId) ?? null;
      }
    }
    return null;
  }

  async createInvitation(input: CreateInvitationInput) {
    const inv: Invitation = {
      id: uuid(),
      email: input.email,
      organizationId: input.organizationId,
      teamId: input.teamId ?? null,
      roleId: input.roleId,
      tokenHash: input.tokenHash,
      status: 'PENDING',
      expiresAt: input.expiresAt,
      acceptedAt: null,
      revokedAt: null,
      createdAt: new Date(),
      invitedById: input.invitedById ?? null
    };
    this.invitations.set(inv.id, inv);
    this.invitationsByHash.set(inv.tokenHash, inv.id);
    return inv;
  }

  async findInvitationByTokenHash(tokenHash: string) {
    const id = this.invitationsByHash.get(tokenHash);
    if (!id) return null;
    return this.invitations.get(id) ?? null;
  }

  async acceptInvitation(params: { invitationId: string; acceptedAt: Date }): Promise<void> {
    const inv = this.invitations.get(params.invitationId);
    if (!inv) return;
    inv.status = 'ACCEPTED';
    inv.acceptedAt = params.acceptedAt;
  }

  async revokeInvitation(params: { invitationId: string; revokedAt: Date }): Promise<void> {
    const inv = this.invitations.get(params.invitationId);
    if (!inv) return;
    inv.status = 'REVOKED';
    inv.revokedAt = params.revokedAt;
  }
}
