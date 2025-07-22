import { api } from '../api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Register user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Get user profile
  async getProfile(): Promise<{ success: boolean; user: User }> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Logout
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Verify email
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email
  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Forgot password
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  // Store tokens in localStorage
  storeTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  // Clear tokens from localStorage
  clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  // Get stored token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  // Get current user from localStorage or decode from token
  getCurrentUser(): User | null {
    try {
      if (typeof window === 'undefined') return null;

      const token = this.getToken();
      if (!token) return null;

      // Try to get user from localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        // Validate that the stored user has required fields
        if (user.id && user.email && user.role) {
          return user;
        }
      }

      // If no stored user or invalid, decode from JWT token
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 JWT Payload:', payload); // Debug log

        const user = {
          id: payload.sub || payload.userId || payload.id,
          name: payload.name || 'User',
          email: payload.email || '',
          role: payload.role || 'GUEST',
          isEmailVerified: payload.isEmailVerified || false,
          createdAt: payload.createdAt || new Date().toISOString(),
          updatedAt: payload.updatedAt || new Date().toISOString()
        };

        // Store the decoded user for future use
        this.storeUser(user);
        console.log('✅ User decoded from JWT:', user); // Debug log

        return user;
      } catch (decodeError) {
        console.error('Error decoding JWT token:', decodeError);
        return null;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Store user data in localStorage
  storeUser(user: User) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Clear user data from localStorage
  clearUser() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
  },

  // Get recent activity based on user role
  async getRecentActivity(limit: number = 10) {
    const response = await api.get(`/auth/recent-activity?limit=${limit}`);
    return response.data;
  },

  // Get dashboard statistics based on user role
  async getDashboardStats() {
    const response = await api.get('/auth/dashboard-stats');
    return response.data;
  },

  // Get calendar data based on user role
  async getCalendarData(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const response = await api.get(`/auth/calendar?${params.toString()}`);
    return response.data;
  }
};
