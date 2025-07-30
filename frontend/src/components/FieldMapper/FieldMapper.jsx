// frontend/src/components/FieldMapper/FieldMapper.jsx
import React, { useState, useEffect } from 'react';

const FieldMapper = ({ originalFields, onMappingChange, isOpen, onToggle }) => {
  const [fieldMappings, setFieldMappings] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Campos de base de datos (DESTINO) exactos del archivo de mapeo
  const databaseFields = {
    // Campos obligatorios
    'journal_entry_id': { 
      label: 'journal_entry_id', 
      required: true, 
      confidence: 0.95,
      description: 'Identificador único del asiento contable'
    },
    'line_number': { 
      label: 'line_number', 
      required: true, 
      confidence: 1.0,
      description: 'Número secuencial de la línea del asiento'
    },
    'description': { 
      label: 'description', 
      required: true, 
      confidence: 0.9,
      description: 'Descripción general del asiento contable'
    },
    'line_description': { 
      label: 'line_description', 
      required: true, 
      confidence: 0.95,
      description: 'Descripción específica de la línea del asiento'
    },
    'posting_date': { 
      label: 'posting_date', 
      required: true, 
      confidence: 1.0,
      description: 'Fecha de contabilización del asiento'
    },
    'fiscal_year': { 
      label: 'fiscal_year', 
      required: true, 
      confidence: 1.0,
      description: 'Año del ejercicio fiscal'
    },
    'gl_account_number': { 
      label: 'gl_account_number', 
      required: true, 
      confidence: 0.8,
      description: 'Número de cuenta del libro mayor'
    },
    'amount': { 
      label: 'amount', 
      required: true, 
      confidence: 0.95,
      description: 'Importe en moneda local'
    },
    'debit_credit_indicator': { 
      label: 'debit_credit_indicator', 
      required: true, 
      confidence: 1.0,
      description: 'Indicador debe/haber (S = Debe, H = Haber)'
    },
    
    // Campos opcionales
    'period_number': { 
      label: 'period_number', 
      required: false, 
      confidence: 0.0,
      description: 'Número de período contable'
    },
    'prepared_by': { 
      label: 'prepared_by', 
      required: false, 
      confidence: 0.9,
      description: 'Usuario que preparó el asiento'
    },
    'entry_date': { 
      label: 'entry_date', 
      required: false, 
      confidence: 0.95,
      description: 'Fecha de entrada al sistema'
    },
    'entry_time': { 
      label: 'entry_time', 
      required: false, 
      confidence: 1.0,
      description: 'Hora de entrada al sistema'
    },
    'gl_account_name': { 
      label: 'gl_account_name', 
      required: false, 
      confidence: 0.0,
      description: 'Nombre descriptivo de la cuenta contable'
    },
    'vendor_id': { 
      label: 'vendor_id', 
      required: false, 
      confidence: 0.7,
      description: 'Identificador del proveedor/acreedor'
    },

    // Campos adicionales identificados sin mapeo directo
    'company_code': { 
      label: 'company_code', 
      required: false, 
      confidence: 0.95,
      description: 'Sociedad/Empresa - Alta relevancia'
    },
    'currency': { 
      label: 'currency', 
      required: false, 
      confidence: 0.9,
      description: 'Moneda - Alta relevancia'
    },
    'status_indicator': { 
      label: 'status_indicator', 
      required: false, 
      confidence: 0.6,
      description: 'Estado/Status - Media relevancia'
    },
    'transaction_code': { 
      label: 'transaction_code', 
      required: false, 
      confidence: 0.6,
      description: 'Código de Transacción - Media relevancia'
    },
    'reversal_indicator': { 
      label: 'reversal_indicator', 
      required: false, 
      confidence: 0.6,
      description: 'Anulación/Contrapartida - Media relevancia'
    },
    'document_type': { 
      label: 'document_type', 
      required: false, 
      confidence: 0.6,
      description: 'Clase de Documento - Media relevancia'
    },
    'document_date': { 
      label: 'document_date', 
      required: false, 
      confidence: 0.85,
      description: 'Fecha del Documento - Alta relevancia'
    },
    'last_update': { 
      label: 'last_update', 
      required: false, 
      confidence: 0.3,
      description: 'Última Actualización - Baja relevancia'
    },
    'amount_local_currency': { 
      label: 'amount_local_currency', 
      required: false, 
      confidence: 0.95,
      description: 'Importe en Moneda Local - Alta relevancia'
    },
    'clearing_document': { 
      label: 'clearing_document', 
      required: false, 
      confidence: 0.6,
      description: 'Documento de Compensación - Media relevancia'
    },
    'clearing_date': { 
      label: 'clearing_date', 
      required: false, 
      confidence: 0.6,
      description: 'Fecha Compensación - Media relevancia'
    },
    'assignment_field': { 
      label: 'assignment_field', 
      required: false, 
      confidence: 0.6,
      description: 'Campo de Asignación/Compensación - Media relevancia'
    },
    'additional_code': { 
      label: 'additional_code', 
      required: false, 
      confidence: 0.3,
      description: 'Código adicional - Baja relevancia'
    }
  };

  // Mapeo automático basado en el archivo de referencia (ORIGEN → DESTINO)
  const automaticMappings = {
    // Mapeos directos del archivo
    'Nº doc.': 'journal_entry_id',
    'Pos': 'line_number',
    'Texto Cabecera': 'description',
    'Texto Posición': 'line_description',
    'Fe.Contab.': 'posting_date',
    'Año': 'fiscal_year',
    'Lib.Mayor': 'gl_account_number',
    'Importe ML': 'amount',
    'D/H': 'debit_credit_indicator',
    'Usuario': 'prepared_by',
    'FechaEntr': 'entry_date',
    'Hora': 'entry_time',
    'Acreedor': 'vendor_id',

    // Campos adicionales identificados
    'Sociedad': 'company_code',
    'Moneda': 'currency',
    'S': 'status_indicator',
    'CódT': 'transaction_code',
    'Anul.con': 'reversal_indicator',
    'Clase doc.': 'document_type',
    'Fecha doc.': 'document_date',
    'Últ.act.': 'last_update',
    'Importe ML': 'amount_local_currency', // También puede mapearse aquí
    'Compensación': 'assignment_field',
    'Fe.Comp.': 'clearing_date',
    'Doc.Comp.': 'clearing_document',
    'CT': 'additional_code'
  };

  useEffect(() => {
    if (originalFields && originalFields.length > 0) {
      const initialMappings = {};
      originalFields.forEach(field => {
        // Usar mapeo automático si existe, sino dejar sin mapear
        initialMappings[field] = automaticMappings[field] || '';
      });
      setFieldMappings(initialMappings);
    }
  }, [originalFields]);

  const handleMappingChange = (originalField, targetField) => {
    const newMappings = {
      ...fieldMappings,
      [originalField]: targetField
    };
    setFieldMappings(newMappings);
  };

  const handleApplyMappings = () => {
    if (onMappingChange) {
      onMappingChange(fieldMappings);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
    if (confidence >= 0.5) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.9) return 'Alta';
    if (confidence >= 0.7) return 'Media';
    if (confidence >= 0.5) return 'Baja';
    return 'Sin mapeo';
  };

  const getMappedCount = () => {
    return Object.values(fieldMappings).filter(mapping => mapping !== '').length;
  };

  const getRequiredMappedCount = () => {
    const mappedRequiredFields = Object.entries(fieldMappings)
      .filter(([_, targetField]) => targetField && databaseFields[targetField]?.required)
      .length;
    const totalRequiredFields = Object.values(databaseFields).filter(field => field.required).length;
    return { mapped: mappedRequiredFields, total: totalRequiredFields };
  };

  const filteredDatabaseFields = Object.entries(databaseFields).filter(([key, field]) =>
    key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!originalFields || originalFields.length === 0) {
    return null;
  }

  const requiredStats = getRequiredMappedCount();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Mapeo de Campos de Base de Datos
              </h3>
              
              {/* Estadísticas */}
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getMappedCount()}/{originalFields.length} mapeados
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  requiredStats.mapped === requiredStats.total 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {requiredStats.mapped}/{requiredStats.total} obligatorios
                </span>
              </div>
            </div>
          </div>

          {/* Botón Aplicar */}
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApplyMappings();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Aplicar
            </button>
            
            {/* Icono de expand/collapse */}
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Contenido del mapeo */}
      {isOpen && (
        <div className="p-6">
          {/* Buscador */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="Buscar campos de base de datos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla de mapeo - Orden: Campo BD | Campo SAP | Confianza | Obligatorio | Descripción */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campo Base de Datos (Destino)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campo SAP (Origen)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confianza
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Obligatorio
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDatabaseFields.map(([databaseField, fieldInfo], index) => {
                  // Encontrar qué campo SAP está mapeado a este campo de BD
                  const mappedSAPField = Object.entries(fieldMappings)
                    .find(([_, mappedField]) => mappedField === databaseField)?.[0] || '';
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {fieldInfo.label}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <select
                          value={mappedSAPField}
                          onChange={(e) => {
                            // Limpiar mapeo anterior si existe
                            const currentMappedField = Object.entries(fieldMappings)
                              .find(([_, mappedField]) => mappedField === databaseField);
                            if (currentMappedField) {
                              handleMappingChange(currentMappedField[0], '');
                            }
                            // Establecer nuevo mapeo
                            if (e.target.value) {
                              handleMappingChange(e.target.value, databaseField);
                            }
                          }}
                          className="block w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                        >
                          <option value="">-- Sin mapear --</option>
                          {originalFields.map((sapField) => {
                            // Verificar si este campo SAP ya está mapeado a otro campo BD
                            const isAlreadyMapped = fieldMappings[sapField] && fieldMappings[sapField] !== databaseField;
                            return (
                              <option 
                                key={sapField} 
                                value={sapField}
                                disabled={isAlreadyMapped}
                                style={isAlreadyMapped ? { color: '#9CA3AF' } : {}}
                              >
                                {sapField} {isAlreadyMapped ? '(ya mapeado)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {mappedSAPField && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(fieldInfo.confidence)}`}>
                            {getConfidenceLabel(fieldInfo.confidence)} ({Math.round(fieldInfo.confidence * 100)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {fieldInfo.required && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Sí
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-gray-500">
                          {fieldInfo.description}
                        </div>
                      </td>
                    </tr>
                  )}
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen y acciones */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Progreso del mapeo:</span>
                  <span className="ml-2 text-gray-600">
                    {getMappedCount()} de {Object.keys(databaseFields).length} campos de BD mapeados
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Campos obligatorios:</span>
                  <span className={`ml-2 ${
                    requiredStats.mapped === requiredStats.total 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {requiredStats.mapped} de {requiredStats.total} completados
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const resetMappings = {};
                    originalFields.forEach(field => {
                      resetMappings[field] = '';
                    });
                    setFieldMappings(resetMappings);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Limpiar Todo
                </button>
                <button
                  onClick={() => {
                    const autoMappings = {};
                    originalFields.forEach(field => {
                      autoMappings[field] = automaticMappings[field] || '';
                    });
                    setFieldMappings(autoMappings);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Mapeo Automático
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldMapper;