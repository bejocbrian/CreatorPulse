import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserPayload, DecodedToken } from '../types/auth.types';

export const generateAccessToken = (payload: UserPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.refreshToken.secret, {
    expiresIn: config.refreshToken.expiresIn,
  });
};

export const verifyAccessToken = (token: string): DecodedToken => {
  return jwt.verify(token, config.jwt.secret) as DecodedToken;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.refreshToken.secret) as { userId: string };
};

export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generatePasswordResetToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
