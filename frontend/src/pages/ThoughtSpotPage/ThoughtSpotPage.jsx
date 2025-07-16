// frontend/src/pages/ThoughtSpotPage/ThoughtSpotPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveboardEmbed } from '@thoughtspot/visual-embed-sdk/react';
import Header from '../../components/Header/Header';
import userService from '../../services/userService';

const ThoughtSpotPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [availableProjectIds, setAvailableProjectIds] = useState([
    '10000', '10023', '10024', '10025', '10026', '10028', '10029', '10030'
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar usuario actual
      const userResponse = await userService.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user);
        
        // Verificar permisos
        if (!userResponse.user.permissions?.canAccessThoughtSpot) {
          setError('No tienes permisos para acceder a ThoughtSpot');
          return;
        }
      } else {
        setError('Error al cargar información del usuario');
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar la información inicial');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectIdChange = (projectId) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const selectAllProjectIds = () => {
    setSelectedProjectIds(availableProjectIds);
  };

  const clearAllProjectIds = () => {
    setSelectedProjectIds([]);
  };

  // Crear filtros para ThoughtSpot
  const getRuntimeFilters = () => {
    if (selectedProjectIds.length === 0) return [];
    
    return [
      {
        columnName: 'Project Id', // Nombre exacto de la columna en ThoughtSpot
        operator: 'IN',
        values: selectedProjectIds
      }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-purple-600 mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header user={user} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center border border-red-100">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error de acceso</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Reintentar
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      
      <main className="flex-1 flex flex-col">
        {/* Breadcrumb - Full width, alineado a la izquierda */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Inicio
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">ThoughtSpot</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Título centrado */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard ThoughtSpot</h1>
          <p className="text-gray-600">Visualización interactiva de datos</p>
        </div>

        {/* Filtros a la izquierda */}
        <div className="w-full px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-start space-x-4">
            {/* Dropdown de Project IDs */}
            <div className="relative z-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Project ID
              </label>
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="inline-flex items-center justify-between w-80 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                >
                  <span className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Project ID</div>
                      <div className="text-xs text-gray-500">
                        {selectedProjectIds.length > 0 
                          ? `${selectedProjectIds.length} seleccionados`
                          : 'Selecciona proyectos'
                        }
                      </div>
                    </div>
                  </span>
                  <svg 
                    className={`w-5 h-5 ml-2 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-96 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl left-0">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                          Project ID
                        </h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={selectAllProjectIds}
                            className="text-xs font-medium text-purple-600 hover:text-purple-800 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 transition-colors"
                          >
                            Todos
                          </button>
                          <button
                            onClick={clearAllProjectIds}
                            className="text-xs font-medium text-gray-600 hover:text-gray-800 px-3 py-1 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>
                      
                      {/* Contador de seleccionados */}
                      {selectedProjectIds.length > 0 && (
                        <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-purple-700 font-medium">
                              {selectedProjectIds.length} proyectos seleccionados
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {selectedProjectIds.slice(0, 3).map(id => (
                                <span key={id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {id}
                                </span>
                              ))}
                              {selectedProjectIds.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  +{selectedProjectIds.length - 3} más
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg">
                        {availableProjectIds.map(projectId => (
                          <label key={projectId} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedProjectIds.includes(projectId)}
                              onChange={() => handleProjectIdChange(projectId)}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">{projectId}</span>
                            {selectedProjectIds.includes(projectId) && (
                              <svg className="w-4 h-4 ml-auto text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                            )}
                          </label>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-200 flex space-x-3">
                        <button
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                          Aplicar filtros
                        </button>
                        <button
                          onClick={() => setIsDropdownOpen(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Container */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
            <div className="h-full">
              <LiveboardEmbed
                liveboardId="56694e30-688e-460d-9614-19741b488296"
                frameParams={{
                  height: '100vh',
                  width: '100%', 
                }}
                hideLiveboardHeader={true}      
                hiddenActions={[
                    'explore',
                    'exploreChart',
                    'drill',
                    'drillDown',
                    'drillUp',
                    'contextMenu'
                ]}
                runtimeFilters={getRuntimeFilters()}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ThoughtSpotPage;