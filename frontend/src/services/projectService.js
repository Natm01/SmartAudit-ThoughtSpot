// frontend/src/services/projectService.js
import api from './api';

class ProjectService {
  async getAllProjects() {
    try {
      const response = await api.get('/api/projects/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all projects:', error);
      throw error;
    }
  }

  async getProjectsForUser(userId) {
    try {
      const response = await api.get(`/api/projects/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects for user:', error);
      throw error;
    }
  }

  async getProjectsForCurrentUser() {
    try {
      const response = await api.get('/api/projects/current-user');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects for current user:', error);
      throw error;
    }
  }

  async getProjectById(projectId) {
    try {
      const response = await api.get(`/api/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project by ID:', error);
      throw error;
    }
  }
}

export default new ProjectService();