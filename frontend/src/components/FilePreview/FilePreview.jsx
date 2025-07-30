// frontend/src/components/FilePreview/FilePreview.jsx
import React, { useState, useEffect } from 'react';
import FieldMapper from '../FieldMapper/FieldMapper';

const FilePreview = ({ file, fileType, executionId, maxRows = 25 }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [showMappedNames, setShowMappedNames] = useState(false);
  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [showAppliedNotification, setShowAppliedNotification] = useState(false);

  // Campos de base de datos exactos (nombres de columnas reales)
  const databaseFields = {
    'journal_entry_id': 'journal_entry_id',
    'line_number': 'line_number',
    'description': 'description',
    'line_description': 'line_description',
    'posting_date': 'posting_date',
    'fiscal_year': 'fiscal_year',
    'gl_account_number': 'gl_account_number',
    'amount': 'amount',
    'debit_credit_indicator': 'debit_credit_indicator',
    'prepared_by': 'prepared_by',
    'entry_date': 'entry_date',
    'entry_time': 'entry_time',
    'vendor_id': 'vendor_id',
    'period_number': 'period_number',
    'gl_account_name': 'gl_account_name',
    // Campos adicionales identificados
    'company_code': 'company_code',
    'currency': 'currency',
    'status_indicator': 'status_indicator',
    'transaction_code': 'transaction_code',
    'reversal_indicator': 'reversal_indicator',
    'document_type': 'document_type',
    'document_date': 'document_date',
    'last_update': 'last_update',
    'amount_local_currency': 'amount_local_currency',
    'clearing_document': 'clearing_document',
    'clearing_date': 'clearing_date',
    'assignment_field': 'assignment_field',
    'additional_code': 'additional_code'
  };

  useEffect(() => {
    if (file) {
      loadPreviewData();
    }
  }, [file, fileType, executionId]);

  const generateMergedSAPData = () => {
    // Headers completos del merge BSEG + BKPF
    const headers = [
      'Sociedad', 'Año', 'Nº Documento', 'Posición', 'D/H', 
      'Importe ML', 'Importe', 'Lib.Mayor', 'Texto Posición',
      'Compensación', 'Fe.Comp.', 'Doc.Comp.', 'Acreedor', 'CT',
      'Fe.Contab.', 'FechaEntr', 'Hora', 'Usuario', 'Texto Cabecera',
      'Moneda', 'Indicador', 'CódTransacción', 'Anulación', 'Clase Doc.', 'Fecha Doc.'
    ];

    // Datos mock representando el merge BSEG + BKPF
    const mockData = [
      ['OIVE', '2023', '0000000017', '001', 'S', '12,00', '12,00', '5725330379', '000000000000 360001 LIQ.CTA.VISTA', '02.01.2023', '04.01.2023', '0000000067', '', '40', '02.01.2023', '03.01.2023', '08:11:01', 'UIPATH_01', '0078155800002', 'EUR', '', 'FB01', '', 'BC', '02.01.2023'],
      ['OIVE', '2023', '0000000017', '002', 'H', '12,00', '12,00', '5725330300', '000000000000 360001 LIQ.CTA.VISTA', '', '', '', '', 'Z5', '02.01.2023', '03.01.2023', '08:11:01', 'UIPATH_01', '0078155800002', 'EUR', '', 'FB01', '', 'BC', '02.01.2023'],
      ['OIVE', '2023', '0000000018', '001', 'S', '10,00', '10,00', '5725330351', '000000000000 380041 COMISION DE SERVICIO', '02.01.2023', '05.01.2023', '0000000089', '', '40', '02.01.2023', '03.01.2023', '08:11:01', 'UIPATH_01', '0078155800001', 'EUR', '', 'FB01', '', 'BC', '02.01.2023'],
      ['OIVE', '2023', '0000000018', '002', 'H', '10,00', '10,00', '5725330300', '000000000000 380041 COMISION DE SERVICIO', '', '', '', '', 'Z5', '02.01.2023', '03.01.2023', '08:11:01', 'UIPATH_01', '0078155800001', 'EUR', '', 'FB01', '', 'BC', '02.01.2023'],
      ['OIVE', '2023', '0000000019', '001', 'S', '2.865,30', '2.865,30', '5723203353', '0000000000009340032249386-01', '01.01.2023', '05.01.2023', '0000000091', '', '40', '01.01.2023', '03.01.2023', '08:42:36', 'UIPATH_01', '0078166700003', 'EUR', '', 'FB01', '', 'BC', '01.01.2023'],
      ['OIVE', '2023', '0000000019', '002', 'H', '2.865,30', '2.865,30', '5723203300', '0000000000009340032249386-01', '', '', '', '', 'Z5', '01.01.2023', '03.01.2023', '08:42:36', 'UIPATH_01', '0078166700003', 'EUR', '', 'FB01', '', 'BC', '01.01.2023'],
      ['OIVE', '2023', '0000000020', '001', 'S', '2.869,30', '2.869,30', '5723203300', '000200523809 DC: 2931.0200523809 SCF-TRASPASO', '', '', '', '', 'Z4', '01.01.2023', '03.01.2023', '08:42:37', 'UIPATH_01', '0078166700005', 'EUR', '', 'FB01', '', 'BC', '01.01.2023'],
      ['OIVE', '2023', '0000000020', '002', 'H', '2.869,30', '2.869,30', '5523210032', '000200523809 DC: 2931.0200523809 SCF-TRASPASO', '', '', '', '', '50', '01.01.2023', '03.01.2023', '08:42:37', 'UIPATH_01', '0078166700005', 'EUR', '', 'FB01', '', 'BC', '01.01.2023'],
      ['OIVE', '2023', '0000000021', '001', 'S', '4,00', '4,00', '5723203351', '000000000000 SERV. CUSTODIA DEP.', '11.01.2023', '11.01.2023', '0000000126', '', '40', '01.01.2023', '03.01.2023', '08:42:37', 'UIPATH_01', '0078166700004', 'EUR', '', 'FB01', '', 'BC', '01.01.2023'],
      ['OIVE', '2023', '0000000021', '002', 'H', '4,00', '4,00', '5723203300', '000000000000 SERV. CUSTODIA DEP.', '', '', '', '', 'Z5', '01.01.2023', '03.01.2023', '08:42:37', 'UIPATH_01', '0078166700004', 'EUR', '', 'FB01', '', 'BC', '01.01.2023'],
      ['OIVE', '2023', '0000000024', '001', 'S', '149.080,44', '149.080,44', '5523210003', 'TRASP. AGRUPADO TRASP. DST: 3999-020-0160943', '', '', '', '', '40', '03.01.2023', '04.01.2023', '07:41:47', 'UIPATH_01', '0078174400007', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000024', '002', 'H', '149.080,44', '149.080,44', '5720313700', 'TRASP. AGRUPADO TRASP. DST: 3999-020-0160943', '', '', '', '', 'Z5', '03.01.2023', '04.01.2023', '07:41:47', 'UIPATH_01', '0078174400007', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000025', '001', 'S', '155.708,85', '155.708,85', '5720313700', 'TRANSFERENCIAS GRUPO ANTOLIN-ARAGUSA SA', '', '', '', '', 'Z4', '03.01.2023', '04.01.2023', '07:41:47', 'UIPATH_01', '0078174400006', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000025', '002', 'H', '155.708,85', '155.708,85', '5720313704', 'TRANSFERENCIAS GRUPO ANTOLIN-ARAGUSA SA', '04.01.2023', '04.01.2023', '0000000045', '', '50', '03.01.2023', '04.01.2023', '07:41:47', 'UIPATH_01', '0078174400006', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000026', '001', 'S', '863,46', '863,46', '5720313751', 'ADEUDO A SU CARG ES51000W0031602F', '03.01.2023', '04.01.2023', '0000000042', '', '40', '03.01.2023', '04.01.2023', '07:41:48', 'UIPATH_01', '0078174400001', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000026', '002', 'H', '863,46', '863,46', '5720313700', 'ADEUDO A SU CARG ES51000W0031602F', '', '', '', '', 'Z5', '03.01.2023', '04.01.2023', '07:41:48', 'UIPATH_01', '0078174400001', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000027', '001', 'S', '887,50', '887,50', '5720313751', 'ADEUDO A SU CARG ES51000W0031602F', '03.01.2023', '04.01.2023', '0000000043', '', '40', '03.01.2023', '04.01.2023', '07:41:48', 'UIPATH_01', '0078174400002', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000027', '002', 'H', '887,50', '887,50', '5720313700', 'ADEUDO A SU CARG ES51000W0031602F', '', '', '', '', 'Z5', '03.01.2023', '04.01.2023', '07:41:48', 'UIPATH_01', '0078174400002', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000028', '001', 'S', '1.809,41', '1.809,41', '5720313751', 'ADEUDO A SU CARG ES51000W0031602F', '03.01.2023', '04.01.2023', '0000000040', '', '40', '03.01.2023', '04.01.2023', '07:41:48', 'UIPATH_01', '0078174400003', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000028', '002', 'H', '1.809,41', '1.809,41', '5720313700', 'ADEUDO A SU CARG ES51000W0031602F', '', '', '', '', 'Z5', '03.01.2023', '04.01.2023', '07:41:48', 'UIPATH_01', '0078174400003', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000029', '001', 'S', '920,53', '920,53', '5720313751', 'ADEUDO A SU CARG ES51000W0031602F', '03.01.2023', '04.01.2023', '0000000044', '', '40', '03.01.2023', '04.01.2023', '07:41:48', 'UIPATH_01', '0078174400004', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000029', '002', 'H', '920,53', '920,53', '5720313700', 'ADEUDO A SU CARG ES51000W0031602F', '', '', '', '', 'Z5', '03.01.2023', '04.01.2023', '07:41:48', 'UIPATH_01', '0078174400004', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000030', '001', 'S', '2.147,51', '2.147,51', '5720313751', 'ADEUDO A SU CARG ES51000W0031602F', '03.01.2023', '04.01.2023', '0000000041', '', '40', '03.01.2023', '04.01.2023', '07:41:49', 'UIPATH_01', '0078174400005', 'EUR', '', 'FB01', '', 'BC', '03.01.2023'],
      ['OIVE', '2023', '0000000030', '002', 'H', '2.147,51', '2.147,51', '5720313700', 'ADEUDO A SU CARG ES51000W0031602F', '', '', '', '', 'Z5', '03.01.2023', '04.01.2023', '07:41:49', 'UIPATH_01', '0078174400005', 'EUR', '', 'FB01', '', 'BC', '03.01.2023']
    ];

    return { headers, data: mockData.slice(0, maxRows) };
  };

  const parseExcelFile = async () => {
    const mockHeaders = ['CUENTA', 'DESCRIPCIÓN', 'SALDO INICIAL DEBE', 'SALDO INICIAL HABER', 'MOVIM. DEBE', 'MOVIM. HABER', 'SALDO FINAL DEBE', 'SALDO FINAL HABER'];
    const mockData = [];
    
    for (let i = 1; i <= 10; i++) {
      const accountNumber = `${43000000 + i}`.padStart(8, '0');
      mockData.push([
        accountNumber,
        `Cuenta contable ${i}`,
        `${(Math.random() * 10000).toFixed(2)}`,
        `${(Math.random() * 5000).toFixed(2)}`,
        `${(Math.random() * 15000).toFixed(2)}`,
        `${(Math.random() * 12000).toFixed(2)}`,
        `${(Math.random() * 8000).toFixed(2)}`,
        `${(Math.random() * 3000).toFixed(2)}`
      ]);
    }
    
    return { headers: mockHeaders, data: mockData };
  };

  const loadPreviewData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (fileType === 'libro_diario') {
        result = generateMergedSAPData();
      } else {
        result = await parseExcelFile();
      }
      
      if (!result || !result.headers || !result.data) {
        throw new Error('No se pudo procesar el archivo');
      }
      
      setPreviewData(result);
    } catch (err) {
      console.error('Error loading preview:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (mappings) => {
    setFieldMappings(mappings);
    // Automáticamente activar la vista de nombres mapeados cuando se aplique el mapeo
    if (Object.values(mappings).some(mapping => mapping !== '')) {
      setShowMappedNames(true);
      setShowAppliedNotification(true);
      
      // Ocultar notificación después de 3 segundos
      setTimeout(() => {
        setShowAppliedNotification(false);
      }, 3000);
    }
  };

  const getDisplayHeaders = () => {
    if (!previewData || !previewData.headers) return [];
    
    return previewData.headers.map(originalHeader => {
      if (showMappedNames && fieldMappings[originalHeader]) {
        const mappedField = fieldMappings[originalHeader];
        return databaseFields[mappedField] || mappedField;
      }
      return originalHeader;
    });
  };

  const getFileTypeLabel = () => {
    return fileType === 'libro_diario' ? 'Libro Diario' : 'Sumas y Saldos (Excel)';
  };

  const getMaxRowsLabel = () => {
    return fileType === 'libro_diario' ? '25 primeras filas' : '10 primeras filas';
  };

  const getFileSize = () => {
    if (file && file.size) {
      return (file.size / 1024 / 1024).toFixed(1);
    }
    return fileType === 'libro_diario' ? '4.8' : '1.0';
  };

  const getMappedFieldsCount = () => {
    return Object.values(fieldMappings).filter(mapping => mapping !== '').length;
  };

  if (!file) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Notificación de mapeo aplicado */}
      {showAppliedNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-in-out">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Mapeo aplicado correctamente</span>
          </div>
          <p className="text-sm mt-1 opacity-90">
            Las columnas ahora muestran nombres de base de datos
          </p>
        </div>
      )}

      {/* FieldMapper Component - Solo para libro diario */}
      {fileType === 'libro_diario' && previewData && (
        <FieldMapper
          originalFields={previewData.headers}
          onMappingChange={handleMappingChange}
          isOpen={isMapperOpen}
          onToggle={() => setIsMapperOpen(!isMapperOpen)}
        />
      )}

      {/* File Preview Component */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Preview: {getFileTypeLabel()}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Mostrando {getMaxRowsLabel()}
              </p>
              {fileType === 'libro_diario' && getMappedFieldsCount() > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  ✓ {getMappedFieldsCount()} campos mapeados a nombres de base de datos {showMappedNames ? '(Aplicado)' : '(Pendiente de aplicar)'}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {fileType === 'libro_diario' && (
                <button
                  onClick={() => setShowMappedNames(!showMappedNames)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    showMappedNames
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {showMappedNames ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Nombres Base de Datos
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
                      </svg>
                      Nombres originales
                    </>
                  )}
                </button>
              )}
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                fileType === 'libro_diario' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {fileType === 'libro_diario' ? 'TXT/SAP' : 'Excel'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-purple-600"></div>
              <span className="ml-3 text-gray-600">Cargando preview...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-red-600 mb-2">Error al cargar preview</p>
              <p className="text-xs text-gray-500">{error}</p>
              <button
                onClick={loadPreviewData}
                className="mt-3 text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Success State */}
          {previewData && !loading && !error && (
            <div>
              {/* File Information */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <p className="text-gray-900">{getFileTypeLabel()}</p>
                  </div>
                  {fileType === 'libro_diario' && (
                    <div>
                      <span className="font-medium text-gray-700">Mapeados:</span>
                      <p className="text-gray-900">{getMappedFieldsCount()}/{previewData.headers.length}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>
                    <p className="text-green-600">✓ Formato válido</p>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                          #
                        </th>
                        {getDisplayHeaders().map((header, index) => {
                          const originalHeader = previewData.headers[index];
                          const isMapped = showMappedNames && fieldMappings[originalHeader];
                          
                          return (
                            <th
                              key={index}
                              className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-20"
                              title={isMapped ? `Original: ${originalHeader}` : originalHeader}
                            >
                              <div className="flex items-center space-x-1">
                                <span className={isMapped ? 'text-blue-700 font-semibold' : ''}>
                                  {header}
                                </span>
                                {isMapped && (
                                  <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.data.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1 text-xs text-gray-500 font-mono sticky left-0 bg-inherit z-10">
                            {rowIndex + 1}
                          </td>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-2 py-1 text-xs text-gray-900 whitespace-nowrap min-w-20"
                              title={cell || ''}
                            >
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;