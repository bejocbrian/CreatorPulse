import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthState } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true, // Important for cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add access token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh token
            const newToken = await this.refreshAccessToken();
            this.setToken(newToken);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearAuth();
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  private clearAuth(): void {
    localStorage.removeItem('accessToken');
    // Don't clear refreshToken - it's stored in httpOnly cookie
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await axios.post<{ accessToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    return response.data.accessToken;
  }

  public async signup(data: {
    email: string;
    password: string;
    name: string;
    creatorType?: string;
    currency?: string;
    payoutRegion?: string;
  }) {
    const response = await this.client.post('/auth/signup', data);
    const { accessToken } = response.data;
    this.setToken(accessToken);
    return response.data;
  }

  public async login(data: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    const { accessToken } = response.data;
    this.setToken(accessToken);
    return response.data;
  }

  public async googleAuth(data: { idToken: string }) {
    const response = await this.client.post('/auth/google', data);
    const { accessToken } = response.data;
    this.setToken(accessToken);
    return response.data;
  }

  public async verifyEmail(data: { token: string }) {
    const response = await this.client.post('/auth/verify-email', data);
    return response.data;
  }

  public async forgotPassword(data: { email: string }) {
    const response = await this.client.post('/auth/forgot-password', data);
    return response.data;
  }

  public async resetPassword(data: { token: string; password: string }) {
    const response = await this.client.post('/auth/reset-password', data);
    return response.data;
  }

  public async logout() {
    const response = await this.client.post('/auth/logout');
    this.clearAuth();
    return response.data;
  }

  public async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data.user;
  }

  // Expose the axios instance for direct usage if needed
  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const api = new ApiClient();
