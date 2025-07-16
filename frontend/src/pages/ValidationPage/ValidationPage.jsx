// frontend/src/pages/ValidationPage/ValidationPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import ValidationTable from '../../components/ValidationTable/ValidationTable';
import FilePreviewModal from '../../components/FilePreviewModal/FilePreviewModal';
import userService from '../../services/userService';
import importService from '../../services/importService';

const ValidationPage = () => {
  const { executionId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [validationData, setValidationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    filename: '',
    data: null
  });

  useEffect(() => {
    loadInitialData();
  }, [executionId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar usuario
      const userResponse = await userService.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user);
      }
      
      // Iniciar validación automáticamente
      await startValidation();
      
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar la información inicial');
    } finally {
      setLoading(false);
    }
  };

  const startValidation = async () => {
    try {
      setProcessing(true);
      
      const response = await importService.validateFiles(executionId);
      if (response.success) {
        setValidationData(response);
      } else {
        setError('Error durante la validación');
      }
    } catch (err) {
      console.error('Error during validation:', err);
      setError('Error durante la validación: ' + (err.response?.data?.detail || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const handlePreviewFile = async (filename) => {
    try {
      const previewData = await importService.previewFile(executionId, filename);
      setPreviewModal({
        isOpen: true,
        filename: filename,
        data: previewData
      });
    } catch (err) {
      console.error('Error previewing file:', err);
      alert('Error al previsualizar el archivo: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleProceedToConversion = async () => {
    try {
      setProcessing(true);
      
      const response = await importService.convertFiles(executionId);
      if (response.success) {
        // Navegar a resultados
        navigate(`/libro-diario/results/${executionId}`);
      } else {
        setError('Error durante la conversión');
      }
    } catch (err) {
      console.error('Error during conversion:', err);
      setError('Error durante la conversión: ' + (err.response?.data?.detail || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const canProceed = validationData?.canProceed && !processing;
  const hasErrors = validationData?.validations?.some(v => v.status === 'error');
  const hasWarnings = validationData?.validations?.some(v => v.status === 'warning');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-purple-600 mb-4"></div>
            <p className="text-gray-600">Iniciando validación...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <button
                    onClick={() => navigate('/libro-diario')}
                    className="ml-1 text-sm font-medium text-gray-500 hover:text-purple-600 md:ml-2"
                  >
                    Importación Libro Diario
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Validación</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Validación de Archivos</h1>
            <p className="text-gray-600">Resultados de la validación de integridad y formato</p>
          </div>

          {/* Indicador de pasos */}
          <div className="mb-8">
            <div className="flex items-center">
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

          {/* Estado de procesamiento */}
          {processing && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">Procesando archivos...</p>
                  <p className="text-sm text-blue-600">Esta operación puede tardar unos momentos</p>
                </div>
              </div>
            </div>
          )}

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

          {/* Tabla de validación */}
          {validationData && (
            <div className="mb-8">
              <ValidationTable
                validations={validationData.validations}
                onPreviewFile={handlePreviewFile}
              />
            </div>
          )}

          {/* Archivos validados exitosamente */}
          {validationData && validationData.validations.some(v => v.status !== 'error') && (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Archivos Validados Exitosamente</h3>
                <div className="space-y-2">
                  {validationData.validations
                    .filter(v => v.status !== 'error')
                    .map((validation, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{validation.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {validation.origin === 'libro_diario' ? 'Libro Diario' : 'Sumas y Saldos'} • 
                              {validation.validationsPerformed} validaciones realizadas
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreviewFile(validation.fileName)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Previsualizar
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-between">
            <button
              onClick={() => navigate('/libro-diario')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>

            <button
              onClick={handleProceedToConversion}
              disabled={!canProceed}
              className={`
                inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white
                ${canProceed 
                  ? 'bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2' 
                  : 'bg-gray-400 cursor-not-allowed'
                }
                transition-colors duration-200
              `}
            >
              {processing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  Continuar a Resultados
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Modal de previsualización */}
      <FilePreviewModal
        isOpen={previewModal.isOpen}
        filename={previewModal.filename}
        data={previewModal.data}
        onClose={() => setPreviewModal({ isOpen: false, filename: '', data: null })}
      />
    </div>
  );
};

export default ValidationPage;