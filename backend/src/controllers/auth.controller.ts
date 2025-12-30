import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { addHours, addDays } from 'date-fns';
import prisma from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from '../config/jwt';
import { hashPassword, comparePasswords } from '../utils/password';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { verifyGoogleToken, findOrCreateGoogleUser } from '../services/oauth.service';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

async function signup(req: Request, res: Response) {
  try {
    const { email, password, name, creatorType, currency, payoutRegion } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        creatorType,
        currency: currency || 'USD',
        payoutRegion,
      },
    });

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), EMAIL_VERIFICATION_EXPIRY_HOURS);

    await prisma.emailVerification.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, verificationToken);

    // Generate tokens
    const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const refreshTokenExpiry = addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        creatorType: user.creatorType,
        currency: user.currency,
        payoutRegion: user.payoutRegion,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Generate tokens
    const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const refreshTokenExpiry = addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        creatorType: user.creatorType,
        currency: user.currency,
        payoutRegion: user.payoutRegion,
        isVerified: user.isVerified,
        avatar: user.avatar,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

async function googleAuth(req: Request, res: Response) {
  try {
    const { idToken } = req.body;

    // Verify Google token
    const googleInfo = await verifyGoogleToken(idToken);

    // Find or create user
    const user = await findOrCreateGoogleUser(googleInfo);

    // Generate tokens
    const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const refreshTokenExpiry = addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Google authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        creatorType: user.creatorType,
        currency: user.currency,
        payoutRegion: user.payoutRegion,
        isVerified: user.isVerified,
        avatar: user.avatar,
      },
      accessToken,
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(400).json({
      error: 'Google authentication failed',
      message: error.message || 'Failed to authenticate with Google',
    });
  }
}

async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.body;

    // Find verification token
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Verification token is invalid or has expired',
      });
    }

    // Check if token has expired
    if (verification.expiresAt < new Date()) {
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      return res.status(400).json({
        error: 'Token expired',
        message: 'Verification token has expired. Please request a new one.',
      });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        isVerified: true,
        emailVerified: new Date(),
      },
    });

    // Delete verification token
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    res.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
}

async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, you will receive password reset instructions',
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), PASSWORD_RESET_EXPIRY_HOURS);

    // Delete any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordReset.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({
      message: 'If an account exists with this email, you will receive password reset instructions',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}

async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    // Find reset token
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Reset token is invalid or has expired',
      });
    }

    // Check if token has expired
    if (reset.expiresAt < new Date()) {
      await prisma.passwordReset.delete({
        where: { id: reset.id },
      });
      return res.status(400).json({
        error: 'Token expired',
        message: 'Reset token has expired. Please request a new one.',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await prisma.user.update({
      where: { id: reset.userId },
      data: {
        password: hashedPassword,
      },
    });

    // Delete all refresh tokens for this user (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: reset.userId },
    });

    // Delete reset token
    await prisma.passwordReset.delete({
      where: { id: reset.id },
    });

    res.json({
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const tokenPayload = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(tokenPayload);

    // Optionally rotate refresh token
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const newExpiry = addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS);

    // Delete old refresh token and create new one
    await prisma.$transaction([
      prisma.refreshToken.delete({
        where: { token: refreshToken },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: newExpiry,
        },
      }),
    ]);

    // Set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired refresh token',
    });
  }
}

async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
}

async function getCurrentUser(req: Request, res: Response) {
  try {
    // User is already attached by auth middleware
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        creatorType: true,
        currency: true,
        payoutRegion: true,
        isVerified: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found',
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export {
  signup,
  login,
  googleAuth,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getCurrentUser,
};
