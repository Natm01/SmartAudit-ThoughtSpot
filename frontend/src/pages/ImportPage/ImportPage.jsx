// frontend/src/pages/ImportPage/ImportPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import ImportForm from '../../components/ImportForm/ImportForm';
import ImportHistory from '../../components/ImportHistory/ImportHistory';
import ExecutionDetailsModal from '../../components/ExecutionDetailsModal/ExecutionDetailsModal';
import userService from '../../services/userService';
import projectService from '../../services/projectService';
import importService from '../../services/importService';

const ImportPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    execution: null
  });

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
        
        // Cargar proyectos del usuario
        const projectsResponse = await projectService.getProjectsForCurrentUser();
        if (projectsResponse.success) {
          setProjects(projectsResponse.projects);
        }
        
        // Cargar historial de importaciones
        const historyResponse = await importService.getImportHistory();
        if (historyResponse.success) {
          setImportHistory(historyResponse.executions);
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar la información inicial');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (formData) => {
    try {
      setUploading(true);
      
      const response = await importService.uploadFile(
        formData.file,
        formData.projectId,
        formData.period,
        'libro_diario_import'
      );
      
      if (response.success) {
        // Navegar a la página de validación
        navigate(`/libro-diario/validation/${response.executionId}`);
      } else {
        setError('Error al subir el archivo');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Error al subir el archivo: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleHistoryItemClick = (execution) => {
    // Abrir modal con detalles en lugar de navegar
    setDetailsModal({
      isOpen: true,
      execution: execution
    });
  };

  const handleCloseDetailsModal = () => {
    setDetailsModal({
      isOpen: false,
      execution: null
    });
  };

  const handleDownloadFromHistory = (filename) => {
    // Función específica para descargas desde el historial
    // Extraer execution_id del nombre del archivo
    const executionId = filename.split('_')[0];
    
    if (executionId) {
      importService.downloadMockFile(filename, executionId);
    } else {
      importService.downloadFile(filename);
    }
  };

  const handleDownloadFromModal = (filename) => {
    // Para descargas desde el modal de detalles
    const executionId = detailsModal.execution?.executionId;
    if (executionId) {
      importService.downloadMockFile(filename, executionId);
    } else {
      importService.downloadFile(filename);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-purple-600 mb-4"></div>
            <p className="text-gray-600">Cargando información...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      
      <main className="flex-1 [&_*]:text-xs [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
        {/* CAMBIO PRINCIPAL: Contenedor más ancho y letra más pequeña */}
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-purple-600"
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
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Importación Libro Diario</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Importación Libro Diario</h1>
            <p className="text-gray-600">Carga y valida tus archivos contables de forma automática</p>
          </div>

          {/* Indicador de pasos */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className="flex items-center text-purple-600">
                <div className="flex items-center justify-center w-8 h-8 border-2 border-purple-600 rounded-full bg-purple-600 text-white text-sm font-medium">
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Importación</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-4"></div>
              <div className="flex items-center text-gray-400">
                <div className="flex items-center justify-center w-8 h-8 border-2 border-gray-300 rounded-full text-sm font-medium">
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
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg p-1.5 hover:bg-red-100 inline-flex h-8 w-8"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* Formulario de importación - Ancho completo */}
            <div>
              <ImportForm
                projects={projects}
                onSubmit={handleFileUpload}
                loading={uploading}
              />
            </div>

            {/* Historial de importaciones - Ancho completo */}
            <div>
              <ImportHistory
                executions={importHistory}
                onItemClick={handleHistoryItemClick}
                onDownload={handleDownloadFromHistory}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modal de detalles de ejecución */}
      <ExecutionDetailsModal
        isOpen={detailsModal.isOpen}
        execution={detailsModal.execution}
        onClose={handleCloseDetailsModal}
        onDownload={handleDownloadFromModal}
      />
    </div>
  );
};

export default ImportPage;