import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as authService from '../services/auth.service';
import { verifyAccessToken } from '../utils/jwt';

export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tokens = await authService.signup(req.body);
    const decoded = verifyAccessToken(tokens.accessToken);
    const user = await authService.getCurrentUser(decoded.userId);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(201).json({
      accessToken: tokens.accessToken,
      user,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tokens = await authService.login(req.body);
    const decoded = verifyAccessToken(tokens.accessToken);
    const user = await authService.getCurrentUser(decoded.userId);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json({
      accessToken: tokens.accessToken,
      user,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const googleAuth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tokens = await authService.googleAuth(req.body);
    const decoded = verifyAccessToken(tokens.accessToken);
    const user = await authService.getCurrentUser(decoded.userId);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json({
      accessToken: tokens.accessToken,
      user,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken && !req.cookies?.refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const token = refreshToken || req.cookies.refreshToken;
    const tokens = await authService.refreshToken(token);
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.json({ accessToken: tokens.accessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const logoutAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await authService.logoutAll(req.user.userId);
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out from all devices' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ message: 'Password reset email sent' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ message: 'Password reset successful' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await authService.verifyEmail(req.body.token);
    res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const user = await authService.getCurrentUser(req.user.userId);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};
