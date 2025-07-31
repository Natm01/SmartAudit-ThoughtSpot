// frontend/src/pages/ValidationPage/ValidationPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import ValidationPhases from '../../components/ValidationPhases/ValidationPhases';
import FilePreview from '../../components/FilePreview/FilePreview';
import userService from '../../services/userService';

const ValidationPage = () => {
  const { executionId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [executionData, setExecutionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationPhases, setValidationPhases] = useState({
    libroDiario: { completed: false, results: null },
    sumasSaldos: { completed: false, results: null }
  });
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [executionId]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading initial data for execution:', executionId);
      
      // Obtener información del usuario actual desde el servicio
      const userResponse = await userService.getCurrentUser();
      console.log('👤 Current user from service:', userResponse);
      
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user);
        
        // Simular datos de ejecución con el usuario correcto
        const mockExecutionData = {
          executionId: executionId,
          projectId: "hoteles-turisticos-unidos-sa",
          projectName: "HOTELES TURÍSTICOS UNIDOS, S.A.",
          period: "2023-01-01 a 2023-12-31",
          userId: userResponse.user.id,
          userName: userResponse.user.name,
          
          // Archivos como strings para el preview
          libroDiarioFile: "BSEG.txt + BKPF.txt",
          sumasSaldosFile: "SumasSaldos_CYGNUS.xlsx"
        };
        
        setExecutionData(mockExecutionData);
      } else {
        setError('No se pudo cargar la información del usuario');
      }
      
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar la información inicial');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = async (newUser) => {
    try {
      console.log('🔄 User changed in ValidationPage to:', newUser);
      setUser(newUser);
      
      // Actualizar datos de ejecución con el nuevo usuario
      if (executionData) {
        setExecutionData({
          ...executionData,
          userId: newUser.id,
          userName: newUser.name
        });
      }
      
      // Mostrar notificación del cambio
      showUserChangeNotification(newUser.name);
    } catch (err) {
      console.error('Error changing user:', err);
    }
  };

  const showUserChangeNotification = (userName) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span>Cambiado a ${userName}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const handleLibroDiarioValidationComplete = () => {
    setValidationPhases(prev => ({
      ...prev,
      libroDiario: { completed: true, results: 'success' }
    }));
    checkCanProceed();
  };

  const handleSumasSaldosValidationComplete = () => {
    setValidationPhases(prev => ({
      ...prev,
      sumasSaldos: { completed: true, results: 'success' }
    }));
    checkCanProceed();
  };

  const checkCanProceed = () => {
    // Permitir proceder cuando al menos una validación esté completa
    const libroDiarioCompleted = validationPhases.libroDiario.completed;
    const sumasSaldosCompleted = validationPhases.sumasSaldos.completed;
    
    if (libroDiarioCompleted || sumasSaldosCompleted) {
      setCanProceed(true);
    }
  };

  const handleProceedToResults = () => {
    if (canProceed) {
      navigate(`/libro-diario/results/${executionId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          user={user} 
          onUserChange={handleUserChange}
          showUserSelector={true}
        />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
            <span className="ml-4 text-lg text-gray-600">Cargando validación...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onUserChange={handleUserChange}
        showUserSelector={true}
      />
      
      <main className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <a href="/" className="text-gray-400 hover:text-gray-500">
                    <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                    </svg>
                    <span className="sr-only">Inicio</span>
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <a href="/libro-diario" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Importación Libro Diario
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    Validación
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Header con información del usuario */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Validación de Archivos Contables</h1>
            <p className="mt-2 text-sm text-gray-600">
              Proyecto: {executionData?.projectName} • Período: {executionData?.period}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="p-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center text-green-600">
                <div className="flex items-center justify-center w-8 h-8 border-2 border-green-600 rounded-full bg-green-600 text-white text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium">Importación</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-4"></div>
              <div className="flex items-center text-purple-600">
                <div className="flex items-center justify-center w-8 h-8 border-2 border-purple-600 rounded-full bg-purple-600 text-white text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Validación</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-4"></div>
              <div className="flex items-center text-gray-400">
                <div className="flex items-center justify-center w-8 h-8 border-2 border-gray-300 rounded-full text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Resultados</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Validation Content */}
          {executionData && (
            <div className="space-y-6">
              {/* Validación de Libro Diario - Desplegable completo */}
              <ValidationPhases
                fileType="libro_diario"
                onComplete={handleLibroDiarioValidationComplete}
              />

              {/* Tabla del Libro Diario - Ancho completo */}
              <FilePreview
                file={executionData.libroDiarioFile}
                fileType="libro_diario"
                executionId={executionId}
                maxRows={25}
              />

              {/* Validación de Sumas y Saldos */}
              <ValidationPhases
                fileType="sumas_saldos"
                onComplete={handleSumasSaldosValidationComplete}
              />

              {/* Tabla de Sumas y Saldos */}
              <FilePreview
                file={executionData.sumasSaldosFile}
                fileType="sumas_saldos"
                executionId={executionId}
                maxRows={10}
              />

              {/* Botón para continuar - Solo aparece cuando ambas validaciones están completas */}
              {(validationPhases.libroDiario.completed && validationPhases.sumasSaldos.completed) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg flex-1 mr-6">
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">Todas las validaciones completadas exitosamente</p>
                        <p className="text-sm text-green-700 mt-1">
                          Los datos están listos para ser convertidos al formato estándar.
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleProceedToResults}
                      className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <span>Continuar a Resultados</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de navegación inferiores */}
          <div className="flex justify-between items-center mt-8 pt-8 border-t border-gray-200">
            <button 
              onClick={() => navigate('/libro-diario')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Importación
            </button>
            
            {canProceed && (
              <button 
                onClick={handleProceedToResults}
                className="flex items-center px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Continuar a Resultados
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ValidationPage;