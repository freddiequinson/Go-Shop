/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { handleApiError } from '@/lib/api/client';
import type { UserLogin, UserCreate, AuthToken, UserResponse } from '@/types';

class AuthService {
  /**
   * Login user
   */
  async login(credentials: UserLogin): Promise<AuthToken> {
    try {
      const formData = new FormData();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await apiClient.post<AuthToken>('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Store token and user data
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Register new user
   */
  async register(data: UserCreate): Promise<AuthToken> {
    try {
      const response = await apiClient.post<AuthToken>('/auth/register', data);

      // Store token and user data
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['access_token', 'user']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Get current user from API
   */
  async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await apiClient.get<UserResponse>('/auth/me');
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get stored user from AsyncStorage
   */
  async getStoredUser(): Promise<UserResponse | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get stored token
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      return null;
    }
  }

  /**
   * Google OAuth login
   */
  async googleLogin(code: string): Promise<AuthToken> {
    try {
      const response = await apiClient.post<AuthToken>('/oauth/google/callback', {
        code,
      });

      // Store token and user data
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new AuthService();
