export type RoleScope = 'ORGANIZATION' | 'TEAM';

export type RoleName =
  | 'ORG_OWNER'
  | 'ORG_ADMIN'
  | 'ORG_MEMBER'
  | 'TEAM_ADMIN'
  | 'TEAM_MEMBER';

export type Role = {
  id: string;
  name: RoleName;
  scope: RoleScope;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  createdByIp: string | null;
  createdByUserAgent: string | null;
  revokedByIp: string | null;
  revokedByUserAgent: string | null;
};

export type PasswordResetToken = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
};

export type EmailVerificationToken = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
};

export type Organization = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Team = {
  id: string;
  organizationId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export type Invitation = {
  id: string;
  email: string;
  organizationId: string;
  teamId: string | null;
  roleId: string;
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  invitedById: string | null;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
};

export type TeamMember = {
  id: string;
  teamId: string;
  userId: string;
  roleId: string;
};

export type CreateUserInput = {
  email: string;
  name?: string | null;
  passwordHash: string;
};

export type CreateRefreshTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string | null;
  createdByUserAgent?: string | null;
};

export type CreatePasswordResetTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string | null;
  createdByUserAgent?: string | null;
};

export type CreateEmailVerificationTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type CreateOrganizationInput = {
  name: string;
};

export type CreateTeamInput = {
  organizationId: string;
  name: string;
};

export type CreateInvitationInput = {
  email: string;
  organizationId: string;
  teamId?: string | null;
  roleId: string;
  tokenHash: string;
  expiresAt: Date;
  invitedById?: string | null;
};

export type AcceptInvitationInput = {
  tokenHash: string;
  userId: string;
};

export interface AuthRepository {
  ensureDefaultRoles(): Promise<void>;
  getRoleByName(name: RoleName): Promise<Role | null>;
  getRoleById(id: string): Promise<Role | null>;

  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(input: CreateUserInput): Promise<User>;
  setUserEmailVerified(userId: string, verifiedAt: Date): Promise<void>;
  updateUserPasswordHash(userId: string, passwordHash: string): Promise<void>;

  createEmailVerificationToken(input: CreateEmailVerificationTokenInput): Promise<EmailVerificationToken>;
  consumeEmailVerificationToken(tokenHash: string, now: Date): Promise<EmailVerificationToken | null>;

  createPasswordResetToken(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken>;
  consumePasswordResetToken(tokenHash: string, now: Date): Promise<PasswordResetToken | null>;

  createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(params: {
    id: string;
    revokedAt: Date;
    revokedByIp?: string | null;
    revokedByUserAgent?: string | null;
  }): Promise<void>;
  rotateRefreshToken(params: {
    oldTokenId: string;
    newToken: CreateRefreshTokenInput;
    rotatedAt: Date;
    revokedByIp?: string | null;
    revokedByUserAgent?: string | null;
  }): Promise<RefreshToken>;
  revokeAllRefreshTokensForUser(userId: string, revokedAt: Date): Promise<void>;

  createOrganization(input: CreateOrganizationInput): Promise<Organization>;
  addOrganizationMember(input: { organizationId: string; userId: string; roleId: string }): Promise<OrganizationMember>;
  getOrganizationMemberRole(params: { organizationId: string; userId: string }): Promise<Role | null>;

  createTeam(input: CreateTeamInput): Promise<Team>;
  addTeamMember(input: { teamId: string; userId: string; roleId: string }): Promise<TeamMember>;
  getTeamMemberRole(params: { teamId: string; userId: string }): Promise<Role | null>;

  createInvitation(input: CreateInvitationInput): Promise<Invitation>;
  findInvitationByTokenHash(tokenHash: string): Promise<Invitation | null>;
  acceptInvitation(params: { invitationId: string; acceptedAt: Date }): Promise<void>;
  revokeInvitation(params: { invitationId: string; revokedAt: Date }): Promise<void>;
}
