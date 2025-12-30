import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { prisma } from '../db/prisma.js';
import { 
  SignupSchema, 
  LoginSchema, 
  GoogleLoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema 
} from '../schemas/auth.js';
import { Request, Response, NextFunction } from 'express';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// JWT helpers
const generateAccessToken = (userId: string, email: string) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
  } catch {
    return null;
  }
};

// Email sending helpers
const sendVerificationEmail = async (email: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your CreatorPulse account',
    html: `
      <h1>Welcome to CreatorPulse!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

const sendPasswordResetEmail = async (email: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset your CreatorPulse password',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to create a new password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
};

// POST /auth/signup
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = SignupSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        creatorType: data.creatorType,
        currency: data.currency,
        payoutRegion: data.payoutRegion,
      },
    });

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id, type: 'email_verification' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    await prisma.emailVerification.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        creatorType: user.creatorType,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = LoginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        creatorType: user.creatorType,
        currency: user.currency,
        payoutRegion: user.payoutRegion,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/google
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = GoogleLoginSchema.parse(req.body);

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: data.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { sub: providerId, email, name, picture } = payload;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { providerId, provider: 'GOOGLE' },
          { email: email!, provider: 'EMAIL' },
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email!,
          name: name || 'Google User',
          avatar: picture || null,
          provider: 'GOOGLE',
          providerId,
          isVerified: true, // Google already verifies email
          creatorType: 'NONE',
        },
      });
    } else if (user.provider !== 'GOOGLE') {
      // Link Google account to existing email user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'GOOGLE',
          providerId,
          avatar: picture || user.avatar,
          isVerified: true,
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        creatorType: user.creatorType,
        currency: user.currency,
        payoutRegion: user.payoutRegion,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// GET /auth/google/callback
export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=no_code`);
    }

    // Exchange code for tokens
    const { tokens } = await client.getToken(code as string);
    const idToken = tokens.id_token;

    if (!idToken) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=no_token`);
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=invalid_token`);
    }

    const { sub: providerId, email, name, picture } = payload;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { providerId, provider: 'GOOGLE' },
          { email: email!, provider: 'EMAIL' },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email!,
          name: name || 'Google User',
          avatar: picture || null,
          provider: 'GOOGLE',
          providerId,
          isVerified: true,
          creatorType: 'NONE',
        },
      });
    } else if (user.provider !== 'GOOGLE') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'GOOGLE',
          providerId,
          avatar: picture || user.avatar,
          isVerified: true,
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Redirect with tokens (in production, you'd use a more secure method)
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    next(error);
  }
};

// POST /auth/refresh
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = RefreshTokenSchema.parse(req.body);
    
    const decoded = verifyRefreshToken(data.refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if token exists and not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: data.refreshToken },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired or revoked' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id);

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

// POST /auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      // Revoke refresh token
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/verify-email
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = VerifyEmailSchema.parse(req.body);

    // Verify token
    const decoded = jwt.verify(data.token, process.env.JWT_SECRET!) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== 'email_verification') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // Find and update user
    const verification = await prisma.emailVerification.findUnique({
      where: { token: data.token },
      include: { user: true },
    });

    if (!verification || verification.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await prisma.user.update({
      where: { id: verification.userId },
      data: { isVerified: true },
    });

    // Delete verification record
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(400).json({ error: 'Verification token expired' });
    }
    next(error);
  }
};

// POST /auth/forgot-password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = ForgotPasswordSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Always return success to prevent email enumeration
    if (user) {
      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      await prisma.passwordReset.upsert({
        where: { userId: user.id },
        create: {
          token: resetToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
        update: {
          token: resetToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await sendPasswordResetEmail(user.email, resetToken);
    }

    // Always return the same message
    res.json({ 
      message: 'If an account exists with that email, a password reset link has been sent.' 
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/reset-password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = ResetPasswordSchema.parse(req.body);

    // Verify token
    const decoded = jwt.verify(data.token, process.env.JWT_SECRET!) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // Find reset record
    const reset = await prisma.passwordReset.findUnique({
      where: { token: data.token },
    });

    if (!reset || reset.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    });

    // Delete reset record
    await prisma.passwordReset.delete({
      where: { id: reset.id },
    });

    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: reset.userId },
      data: { revokedAt: new Date() },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(400).json({ error: 'Reset token expired' });
    }
    next(error);
  }
};

// GET /auth/me
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        creatorType: true,
        currency: true,
        payoutRegion: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
