// frontend/src/services/applicationService.js
import api from './api';

class ApplicationService {
  async getAllApplications() {
    try {
      const response = await api.get('/api/applications/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all applications:', error);
      throw error;
    }
  }

  async getApplicationsForUser(userId) {
    try {
      const response = await api.get(`/api/applications/for-user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching applications for user:', error);
      throw error;
    }
  }

  async getApplicationsForCurrentUser() {
    try {
      const response = await api.get('/api/applications/current-user');
      return response.data;
    } catch (error) {
      console.error('Error fetching applications for current user:', error);
      throw error;
    }
  }
}

export default new ApplicationService();