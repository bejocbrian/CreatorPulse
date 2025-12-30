export interface UserPayload {
  userId: string;
  email: string;
  name: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  creator_type: 'individual' | 'business';
  currency: string;
  payout_region: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GoogleAuthInput {
  idToken: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenDoc {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
