// frontend/src/components/ValidationTable/ValidationTable.jsx
import React, { useState } from 'react';
import ValidationDetailsModal from '../ValidationDetailsModal/ValidationDetailsModal';

const ValidationTable = ({ validations, onPreviewFile }) => {
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    validation: null
  });

  const handleShowDetails = (validation) => {
    setDetailsModal({
      isOpen: true,
      validation: validation
    });
  };

  const handleCloseDetails = () => {
    setDetailsModal({
      isOpen: false,
      validation: null
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return (
          <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full">
            <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ok': return 'Correcto';
      case 'error': return 'Error';
      case 'warning': return 'Advertencia';
      default: return 'Desconocido';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOriginText = (origin) => {
    switch (origin) {
      case 'libro_diario': return 'Libro Diario';
      case 'sumas_saldos': return 'Sumas y Saldos';
      default: return origin;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Resultado de Validaciones</h3>
        <p className="text-sm text-gray-600 mt-1">Detalle de las validaciones realizadas en cada archivo</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Archivo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Origen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Validaciones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detalle
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {validations.map((validation, index) => (
              <React.Fragment key={index}>
                <tr className={`hover:bg-gray-50`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(validation.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(validation.status)}`}>
                        {getStatusText(validation.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{validation.fileName}</div>
                    <div className="text-sm text-gray-500">{validation.fileType.toUpperCase()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {getOriginText(validation.origin)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {validation.validationsPerformed} / {validation.totalValidations}
                    </div>
                    <div className="text-xs text-gray-500">
                      {validation.errorCount > 0 && (
                        <span className="text-red-600">{validation.errorCount} errores</span>
                      )}
                      {validation.errorCount > 0 && validation.warningCount > 0 && <span>, </span>}
                      {validation.warningCount > 0 && (
                        <span className="text-yellow-600">{validation.warningCount} advertencias</span>
                      )}
                      {validation.errorCount === 0 && validation.warningCount === 0 && (
                        <span className="text-green-600">Todo correcto</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleShowDetails(validation)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Ver detalles"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {validation.status !== 'error' && (
                        <button
                          onClick={() => onPreviewFile(validation.fileName)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Previsualizar archivo"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {validations.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No hay validaciones disponibles</p>
        </div>
      )}

      {/* Modal de detalles */}
      <ValidationDetailsModal
        isOpen={detailsModal.isOpen}
        validation={detailsModal.validation}
        onClose={handleCloseDetails}
      />
    </div>
  );
};

export default ValidationTable;