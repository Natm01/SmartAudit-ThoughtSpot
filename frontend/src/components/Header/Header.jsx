// frontend/src/components/Header/Header.jsx
import React, { useState, useEffect } from 'react';
import logo from '../../assets/images/logo-positivo.png';
import api from '../../services/api';
import userService from '../../services/userService';

const Header = ({ user, onUserChange }) => {
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Cargar usuarios disponibles desde el backend
  useEffect(() => {
    const loadAvailableUsers = async () => {
      try {
        setLoadingUsers(true);

        // Intentar cargar desde el backend primero
        try {
          const response = await api.get('/api/users/all');
          if (response.data && response.data.success && response.data.users) {
            console.log('✅ Usuarios cargados desde backend:', response.data.users);
            setAvailableUsers(response.data.users);
            return;
          }
        } catch (backendError) {
          console.log('⚠️ Backend endpoint /api/users/all no disponible, usando datos mock...');
        }

        // Si no hay backend disponible, usar datos mock
        const mockUsers = [
          {
            id: 'carlos.rodriguez',
            name: 'Carlos Rodríguez',
            roleName: 'Senior Auditor',
            department: 'Auditoría Externa',
            projects: ['hoteles-turisticos-unidos-sa', 'proyecto-industrial-norte'],
            permissions: {
              canAccessLibroDiario: true,
              canAccessThoughtSpot: false,
              canManageProjects: false
            }
          },
          {
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
          },
          {
            id: 'juan.lopez',
            name: 'Juan López',
            roleName: 'Junior Auditor',
            department: 'Auditoría Externa',
            projects: ['constructora-mediterranea-sl'],
            permissions: {
              canAccessLibroDiario: true,
              canAccessThoughtSpot: false,
              canManageProjects: false
            }
          }
        ];

        console.log('✅ Usando usuarios mock:', mockUsers);
        setAvailableUsers(mockUsers);
      } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadAvailableUsers();
  }, []);

  const handleSelectUser = (selectedUser) => {
    console.log('🔄 Cambiando usuario a:', selectedUser.name);
    
    // Actualizar el estado en el servicio
    userService.setCurrentUser(selectedUser);
    
    // Llamar la función callback si existe
    if (onUserChange) {
      onUserChange(selectedUser);
    }
    
    // Cerrar el dropdown
    setShowUserSelector(false);
  };

  // Función para generar iniciales del usuario con manejo seguro
  const getUserInitials = (userName) => {
    if (!userName || typeof userName !== 'string') {
      console.warn('getUserInitials called with invalid userName:', userName);
      return '??';
    }
    
    try {
      return userName
        .split(' ')
        .map(n => n && n.length > 0 ? n[0].toUpperCase() : '')
        .filter(initial => initial !== '')
        .join('')
        .substring(0, 2); // Máximo 2 iniciales
    } catch (error) {
      console.error('Error generating initials for:', userName, error);
      return '??';
    }
  };

  // Función auxiliar para obtener nombre seguro
  const getSafeName = (name) => {
    if (!name || typeof name !== 'string') {
      return 'Usuario Desconocido';
    }
    return name.trim() || 'Usuario Desconocido';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <img src={logo} alt="SmartAudit" className="h-12 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gradient">SmartAudit</h1>
            </div>
          </div>

          {/* Usuario actual y selector */}
          <div className="flex items-center space-x-4">
            {/* Información del usuario actual */}
            {user && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {getSafeName(user.name)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.roleName || 'Rol no especificado'}
                  </p>
                </div>
              </div>
            )}

            {/* Selector de usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserSelector(!showUserSelector)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {getUserInitials(user?.name)}
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown de usuarios */}
              {showUserSelector && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Cambiar Usuario</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecciona un usuario para simular su perspectiva
                    </p>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-purple-600 mx-auto"></div>
                        <p className="text-sm mt-2">Cargando usuarios...</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        {availableUsers.map((availableUser) => (
                          <button
                            key={availableUser.id}
                            onClick={() => handleSelectUser(availableUser)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                              user?.id === availableUser.id ? 'bg-purple-50' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                user?.id === availableUser.id ? 'bg-purple-600' : 'bg-gray-400'
                              }`}>
                                {getUserInitials(availableUser.name)}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  user?.id === availableUser.id ? 'text-purple-900' : 'text-gray-900'
                                }`}>
                                  {availableUser.name}
                                  {user?.id === availableUser.id && (
                                    <span className="ml-2 text-xs text-purple-600">(Actual)</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {availableUser.roleName} • {availableUser.department}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;