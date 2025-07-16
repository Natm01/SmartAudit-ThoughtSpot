// frontend/src/services/userService.js
import api from './api';

class UserService {
  async getCurrentUser() {
    try {
      const response = await api.get('/api/users/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async checkUserPermission(userId, permission) {
    try {
      const response = await api.get(`/api/users/${userId}/permissions/${permission}`);
      return response.data;
    } catch (error) {
      console.error('Error checking user permission:', error);
      throw error;
    }
  }
}

export default new UserService();