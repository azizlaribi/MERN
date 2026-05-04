// services/authService.ts
import axios from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth.types';
import { socketService } from './socketService';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('tokenExpiry', Date.now() + response.data.expiresIn * 1000);
      localStorage.setItem('userEmail', data.email);
      
      // Decode token to get userId
      try {
        const decoded = JSON.parse(atob(response.data.token.split('.')[1]));
        localStorage.setItem('userId', decoded.userId);
        localStorage.setItem('name', decoded.name);
      } catch (e) {
        console.error('Failed to decode token');
      }
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout(): void {
    console.log('🔐 Logging out user...');
    
    // Disconnect WebSocket first
    if (socketService.isConnected()) {
      console.log('📡 Disconnecting WebSocket...');
      socketService.disconnect();
    }
    
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    
    console.log('✅ User logged out successfully');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  },

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  },

  getUserId(): string | null {
    return localStorage.getItem('userId');
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');
    if (!token || !expiry) return false;
    return Date.now() < parseInt(expiry);
  },
};