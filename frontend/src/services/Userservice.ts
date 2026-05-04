import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: number;
  isActive: boolean;
  role: 'admin' | 'user';
  picture?: string;
  isGoogleAuth?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const userService = {
  // Get all regular users
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get('/users/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get all admin users
  async getAllAdmins(): Promise<User[]> {
    try {
      const response = await api.get('/users/admins');
      return response.data;
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  },

  // Get total number of users
  async getNumberOfUsers(): Promise<number> {
    try {
      const response = await api.get('/users/numberOfUsers');
      return response.data;
    } catch (error) {
      console.error('Error fetching user count:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User> {
    try {
      const response = await api.get(`/users/${email}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Update user active status
  async toggleUserStatus(userId: string): Promise<{ message: string; user: Partial<User> }> {
    try {
      const response = await api.put(`/users/isActive/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/users/delete/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Edit user
  async editUser(userId: string, userData: Partial<User>): Promise<{ message: string; user: User }> {
    try {
      const response = await api.put(`/users/edit/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error editing user:', error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStatistics() {
    try {
      const totalUsers = await this.getNumberOfUsers();
      const adminUsers = await this.getAllAdmins();
      const regularUsers = await this.getAllUsers();

      return {
        totalUsers,
        adminCount: adminUsers.length,
        regularUserCount: regularUsers.length,
        activeUsers: [...adminUsers, ...regularUsers].filter((u) => u.isActive).length,
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },
};