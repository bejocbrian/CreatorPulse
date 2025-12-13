import { z } from 'zod';
import type { AppEnv } from '../config/env.js';
import { randomToken, sha256 } from '../lib/crypto.js';
import { conflict, unauthorized } from '../lib/errors.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import type { EmailService } from '../types/email.js';
import type { AuthRepository, User } from '../types/repositories.js';

const EmailSchema = z.string().email();

export class AuthService {
  constructor(
    private readonly deps: {
      env: AppEnv;
      repo: AuthRepository;
      email: EmailService;
    }
  ) {}

  private issueAccessToken(user: Pick<User, 'id' | 'email'>): string {
    return signAccessToken({
      userId: user.id,
      email: user.email,
      secret: this.deps.env.jwtAccessSecret,
      expiresInSeconds: this.deps.env.accessTokenTtlSeconds
    });
  }

  private refreshTokenExpiresAt(now: Date): Date {
    const ms = this.deps.env.refreshTokenTtlDays * 24 * 60 * 60 * 1000;
    return new Date(now.getTime() + ms);
  }

  async signup(params: {
    email: string;
    password: string;
    name?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    emailVerificationToken?: string;
  }> {
    const email = EmailSchema.parse(params.email).toLowerCase();

    const existing = await this.deps.repo.findUserByEmail(email);
    if (existing) throw conflict('Email already in use');

    const passwordHash = await hashPassword(params.password);
    const user = await this.deps.repo.createUser({
      email,
      name: params.name ?? null,
      passwordHash
    });

    const now = new Date();

    const rawEmailToken = randomToken(32);
    const emailTokenHash = sha256(rawEmailToken);
    const emailExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await this.deps.repo.createEmailVerificationToken({
      userId: user.id,
      tokenHash: emailTokenHash,
      expiresAt: emailExpiresAt
    });

    const verifyUrl = new URL('/auth/verify-email', this.deps.env.appBaseUrl);
    verifyUrl.searchParams.set('token', rawEmailToken);
    await this.deps.email.sendEmailVerification({ to: user.email, verifyUrl: verifyUrl.toString() });

    const rawRefreshToken = randomToken(48);
    await this.deps.repo.createRefreshToken({
      userId: user.id,
      tokenHash: sha256(rawRefreshToken),
      expiresAt: this.refreshTokenExpiresAt(now),
      createdByIp: params.ip ?? null,
      createdByUserAgent: params.userAgent ?? null
    });

    return {
      user,
      accessToken: this.issueAccessToken(user),
      refreshToken: rawRefreshToken,
      emailVerificationToken: this.deps.env.exposeEmailTokensInResponse ? rawEmailToken : undefined
    };
  }

  async login(params: {
    email: string;
    password: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const email = EmailSchema.parse(params.email).toLowerCase();

    const user = await this.deps.repo.findUserByEmail(email);
    if (!user) throw unauthorized('Invalid email or password');

    const ok = await verifyPassword(params.password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid email or password');

    const now = new Date();
    const rawRefreshToken = randomToken(48);

    await this.deps.repo.createRefreshToken({
      userId: user.id,
      tokenHash: sha256(rawRefreshToken),
      expiresAt: this.refreshTokenExpiresAt(now),
      createdByIp: params.ip ?? null,
      createdByUserAgent: params.userAgent ?? null
    });

    return {
      user,
      accessToken: this.issueAccessToken(user),
      refreshToken: rawRefreshToken
    };
  }

  async logout(params: {
    refreshToken: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    if (!params.refreshToken) return;

    const tokenHash = sha256(params.refreshToken);
    const token = await this.deps.repo.findRefreshTokenByHash(tokenHash);
    if (!token) return;

    if (token.revokedAt) return;

    await this.deps.repo.revokeRefreshToken({
      id: token.id,
      revokedAt: new Date(),
      revokedByIp: params.ip ?? null,
      revokedByUserAgent: params.userAgent ?? null
    });
  }

  async refresh(params: {
    refreshToken: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const now = new Date();

    const oldHash = sha256(params.refreshToken);
    const stored = await this.deps.repo.findRefreshTokenByHash(oldHash);
    if (!stored) throw unauthorized('Invalid refresh token');

    if (stored.revokedAt) {
      await this.deps.repo.revokeAllRefreshTokensForUser(stored.userId, now);
      throw unauthorized('Refresh token revoked');
    }

    if (stored.expiresAt <= now) throw unauthorized('Refresh token expired');

    const rawRefreshToken = randomToken(48);
    const newToken = await this.deps.repo.rotateRefreshToken({
      oldTokenId: stored.id,
      newToken: {
        userId: stored.userId,
        tokenHash: sha256(rawRefreshToken),
        expiresAt: this.refreshTokenExpiresAt(now),
        createdByIp: params.ip ?? null,
        createdByUserAgent: params.userAgent ?? null
      },
      rotatedAt: now,
      revokedByIp: params.ip ?? null,
      revokedByUserAgent: params.userAgent ?? null
    });

    const user = await this.deps.repo.findUserById(newToken.userId);
    if (!user) throw unauthorized('Invalid refresh token');

    return {
      accessToken: this.issueAccessToken(user),
      refreshToken: rawRefreshToken
    };
  }

  async verifyEmail(params: { token: string }): Promise<void> {
    const now = new Date();
    const tokenHash = sha256(params.token);
    const consumed = await this.deps.repo.consumeEmailVerificationToken(tokenHash, now);
    if (!consumed) throw unauthorized('Invalid or expired verification token');

    await this.deps.repo.setUserEmailVerified(consumed.userId, now);
  }

  async requestPasswordReset(params: {
    email: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ passwordResetToken?: string }> {
    const email = EmailSchema.parse(params.email).toLowerCase();

    const user = await this.deps.repo.findUserByEmail(email);
    if (!user) {
      return {};
    }

    const now = new Date();
    const rawResetToken = randomToken(32);
    const tokenHash = sha256(rawResetToken);

    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    await this.deps.repo.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
      createdByIp: params.ip ?? null,
      createdByUserAgent: params.userAgent ?? null
    });

    const resetUrl = new URL('/auth/reset-password', this.deps.env.appBaseUrl);
    resetUrl.searchParams.set('token', rawResetToken);

    await this.deps.email.sendPasswordReset({ to: user.email, resetUrl: resetUrl.toString() });

    return {
      passwordResetToken: this.deps.env.exposeEmailTokensInResponse ? rawResetToken : undefined
    };
  }

  async resetPassword(params: { token: string; newPassword: string }): Promise<void> {
    const now = new Date();
    const tokenHash = sha256(params.token);

    const consumed = await this.deps.repo.consumePasswordResetToken(tokenHash, now);
    if (!consumed) throw unauthorized('Invalid or expired reset token');

    const passwordHash = await hashPassword(params.newPassword);
    await this.deps.repo.updateUserPasswordHash(consumed.userId, passwordHash);
    await this.deps.repo.revokeAllRefreshTokensForUser(consumed.userId, now);
  }
}
