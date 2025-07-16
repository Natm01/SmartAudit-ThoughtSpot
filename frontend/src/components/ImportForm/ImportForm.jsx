// frontend/src/components/ImportForm/ImportForm.jsx
import React, { useState } from 'react';

const ImportForm = ({ projects, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    projectId: '',
    period: '',
    fechaInicio: '',
    fechaFin: '',
    libroDiarioFile: null,
    sumasSaldosFile: null
  });
  const [dragActive, setDragActive] = useState({
    libroDiario: false,
    sumasSaldos: false
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file, type);
    }
  };

  const handleFileSelect = (file, type) => {
    const allowedTypes = ['.csv', '.txt', '.xls', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setErrors(prev => ({
        ...prev,
        [type]: 'Tipo de archivo no válido. Formatos permitidos: CSV, TXT, XLS, XLSX'
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [type]: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [type]: file
    }));
    setErrors(prev => ({
      ...prev,
      [type]: null
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.projectId) {
      newErrors.projectId = 'Debe seleccionar un proyecto';
    }
    if (!formData.fechaInicio || !formData.fechaFin) {
      newErrors.period = 'Debe especificar las fechas de inicio y fin';
    } else if (new Date(formData.fechaInicio) >= new Date(formData.fechaFin)) {
      newErrors.period = 'La fecha de inicio debe ser anterior a la fecha de fin';
    }
    if (!formData.libroDiarioFile) {
      newErrors.libroDiarioFile = 'Debe seleccionar el archivo del libro diario';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit({
      projectId: formData.projectId,
      period: formData.period,
      file: formData.libroDiarioFile
    });
  };

  const FileUploadArea = ({ type, file, error, label, description, required = false }) => {
    const isDragActive = dragActive[type];
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Mostrar archivo seleccionado */}
        {file ? (
          <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                setFormData(prev => ({ ...prev, [type]: null }));
              }} 
              className="text-xs text-red-600 hover:text-red-500 p-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          /* Área de drop/upload */
          <div
            className={`
              relative border border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer
              ${isDragActive 
                ? 'border-purple-400 bg-purple-50' 
                : error 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }
            `}
            onDragEnter={(e) => handleDrag(e, type)}
            onDragLeave={(e) => handleDrag(e, type)}
            onDragOver={(e) => handleDrag(e, type)}
            onDrop={(e) => handleDrop(e, type)}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".csv,.txt,.xls,.xlsx"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0], type);
                }
              }}
            />
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-purple-600">Subir archivos</span>
                </p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Formulario de Importación</h2>
        <p className="text-xs text-gray-600">Complete los datos necesarios para procesar sus archivos contables</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Proyecto <span className="text-red-500">*</span></label>
            <select
              value={formData.projectId}
              onChange={(e) => handleInputChange('projectId', e.target.value)}
              className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.projectId ? 'border-red-300' : 'border-gray-300'}`}
            >
              <option value="">Seleccionar proyecto...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name} - {project.client}</option>
              ))}
            </select>
            {errors.projectId && <p className="mt-1 text-xs text-red-600">{errors.projectId}</p>}
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formData.fechaInicio || ''}
              onChange={(e) => {
                handleInputChange('fechaInicio', e.target.value);
                if (e.target.value && formData.fechaFin) {
                  const inicio = new Date(e.target.value);
                  const fin = new Date(formData.fechaFin);
                  const period = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}-${String(inicio.getDate()).padStart(2, '0')} a ${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`;
                  handleInputChange('period', period);
                }
              }}
              className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.period ? 'border-red-300' : 'border-gray-300'}`}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Fin <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formData.fechaFin || ''}
              onChange={(e) => {
                handleInputChange('fechaFin', e.target.value);
                if (formData.fechaInicio && e.target.value) {
                  const inicio = new Date(formData.fechaInicio);
                  const fin = new Date(e.target.value);
                  const period = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}-${String(inicio.getDate()).padStart(2, '0')} a ${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`;
                  handleInputChange('period', period);
                }
              }}
              className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.period ? 'border-red-300' : 'border-gray-300'}`}
            />
          </div>
        </div>
        
        {errors.period && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.period}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <FileUploadArea 
            type="libroDiarioFile" 
            file={formData.libroDiarioFile} 
            error={errors.libroDiarioFile} 
            label="Archivo Libro Diario" 
            description="CSV, TXT, XLS, XLSX" 
            required 
          />
          <FileUploadArea 
            type="sumasSaldosFile" 
            file={formData.sumasSaldosFile} 
            error={errors.sumasSaldosFile} 
            label="Archivo Sumas y Saldos (Opcional)" 
            description="CSV, TXT, XLS, XLSX" 
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-xs font-medium rounded-lg text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'} transition-colors duration-200`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando archivo...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Subir y Procesar Archivos
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImportForm;