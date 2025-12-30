import { User } from '../models/User.model';
import { RefreshToken } from '../models/RefreshToken.model';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, generateVerificationToken, generatePasswordResetToken, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';
import { verifyGoogleToken } from './google.service';
import { SignupInput, LoginInput, GoogleAuthInput, UserPayload, TokenPair } from '../types/auth.types';

export const signup = async (data: SignupInput): Promise<TokenPair> => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await hashPassword(data.password);
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    email: data.email,
    password: hashedPassword,
    name: data.name,
    creator_type: data.creator_type,
    currency: data.currency,
    payout_region: data.payout_region,
    is_verified: false,
    verification_token: verificationToken,
    verification_expires: verificationExpires,
  });

  await sendVerificationEmail(user.email, user.name, verificationToken);

  const userPayload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken(user._id.toString());

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return { accessToken, refreshToken };
};

export const login = async (data: LoginInput): Promise<TokenPair> => {
  const user = await User.findOne({ email: data.email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.password) {
    throw new Error('Please use Google OAuth to login');
  }

  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const userPayload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken(user._id.toString());

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return { accessToken, refreshToken };
};

export const googleAuth = async (data: GoogleAuthInput): Promise<TokenPair> => {
  const googleUser = await verifyGoogleToken(data.idToken);

  let user = await User.findOne({ google_id: googleUser.sub });

  if (!user) {
    user = await User.findOne({ email: googleUser.email });

    if (user) {
      if (user.password) {
        throw new Error('Email already registered with password. Please login with password.');
      }
      user.google_id = googleUser.sub;
      user.is_verified = true;
      user.name = user.name || googleUser.name;
      user.avatar = googleUser.picture;
      await user.save();
    } else {
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        google_id: googleUser.sub,
        creator_type: 'individual',
        currency: 'USD',
        payout_region: 'US',
        is_verified: googleUser.email_verified,
        avatar: googleUser.picture,
      });
    }
  } else {
    if (!user.is_verified && googleUser.email_verified) {
      user.is_verified = true;
      await user.save();
    }
  }

  const userPayload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken(user._id.toString());

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return { accessToken, refreshToken };
};

export const refreshToken = async (token: string): Promise<TokenPair> => {
  const decoded = verifyRefreshToken(token);

  const refreshTokenDoc = await RefreshToken.findOne({ token });
  if (!refreshTokenDoc) {
    throw new Error('Invalid refresh token');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new Error('User not found');
  }

  await RefreshToken.deleteOne({ token });

  const userPayload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  const accessToken = generateAccessToken(userPayload);
  const newRefreshToken = generateRefreshToken(user._id.toString());

  await RefreshToken.create({
    userId: user._id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (token: string): Promise<void> => {
  await RefreshToken.deleteOne({ token });
};

export const logoutAll = async (userId: string): Promise<void> => {
  await RefreshToken.deleteMany({ userId });
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  const resetToken = generatePasswordResetToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.reset_password_token = resetToken;
  user.reset_password_expires = resetExpires;
  await user.save();

  await sendPasswordResetEmail(user.email, user.name, resetToken);
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const user = await User.findOne({
    reset_password_token: token,
    reset_password_expires: { $gt: new Date() },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.reset_password_token = undefined;
  user.reset_password_expires = undefined;
  await user.save();
};

export const verifyEmail = async (token: string): Promise<void> => {
  const user = await User.findOne({
    verification_token: token,
    verification_expires: { $gt: new Date() },
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  user.is_verified = true;
  user.verification_token = undefined;
  user.verification_expires = undefined;
  await user.save();
};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId).select('-password -verification_token -reset_password_token');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};
