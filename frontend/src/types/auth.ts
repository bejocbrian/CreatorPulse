export interface User {
  id: string;
  email: string;
  name: string;
  creatorType?: string;
  currency: string;
  payoutRegion?: string;
  isVerified: boolean;
  avatar?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  creatorType?: string;
  currency?: string;
  payoutRegion?: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
