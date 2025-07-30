// frontend/src/services/userService.js
import api from './api';

class UserService {
  constructor() {
    // Estado del usuario actual en memoria (no usa localStorage)
    this.currentUserState = null;
    this.isUserOverridden = false;
  }

  async getCurrentUser() {
    try {
      // Si hay un usuario seleccionado manualmente, devolverlo
      if (this.isUserOverridden && this.currentUserState) {
        return {
          success: true,
          user: this.currentUserState
        };
      }

      // Si no hay override, obtener del backend
      const response = await api.get('/api/users/current');
      
      // Guardar en memoria si no hay override
      if (!this.isUserOverridden) {
        this.currentUserState = response.data.user;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      
      // Si hay error y tenemos un usuario en memoria, devolverlo
      if (this.currentUserState) {
        return {
          success: true,
          user: this.currentUserState
        };
      }
      
      // Usuario por defecto si todo falla
      return {
        success: true,
        user: {
          id: 'maria.garcia',
          name: 'María García',
          roleName: 'Auditor Manager',
          department: 'Auditoría Externa',
          projects: ['hoteles-turisticos-unidos-sa', 'constructora-mediterranea-sl'],
          permissions: {
            canAccessLibroDiario: true,
            canAccessThoughtSpot: true,
            canManageProjects: true
          }
        }
      };
    }
  }

  // Nuevo método para establecer el usuario actual (cuando se cambia desde el Header)
  setCurrentUser(user) {
    this.currentUserState = user;
    this.isUserOverridden = true;
    console.log('User state updated in service:', user);
  }

  // Método para resetear al usuario original del backend
  resetToOriginalUser() {
    this.isUserOverridden = false;
    this.currentUserState = null;
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

// Exportar una única instancia para mantener el estado
const userServiceInstance = new UserService();
export default userServiceInstance;