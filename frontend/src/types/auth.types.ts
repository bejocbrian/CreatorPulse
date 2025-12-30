export interface User {
  _id: string;
  email: string;
  name: string;
  creator_type: 'individual' | 'business';
  currency: string;
  payout_region: string;
  avatar?: string;
  is_verified: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  creator_type: 'individual' | 'business';
  currency: string;
  payout_region: string;
}

export interface GoogleAuthData {
  idToken: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}
