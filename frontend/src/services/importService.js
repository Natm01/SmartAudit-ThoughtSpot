// frontend/src/services/importService.js
import api from './api';

class ImportService {
  async uploadFiles(files, projectId, period, testType = 'libro_diario_import') {
    try {
      console.log('🔄 ImportService.uploadFiles called with:', {
        fileCount: files.length,
        fileNames: files.map(f => f.name),
        projectId,
        period,
        testType
      });

      const formData = new FormData();
      
      // Agregar múltiples archivos
      files.forEach((file, index) => {
        console.log(`📁 Adding file ${index}:`, file.name, file.size, 'bytes');
        formData.append('files', file);
      });
      
      formData.append('project_id', projectId);
      formData.append('period', period);
      formData.append('test_type', testType);

      console.log('📤 Sending FormData to /api/import/upload');

      const response = await api.post('/api/import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading files:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  async uploadFile(file, projectId, period, testType = 'libro_diario_import') {
    // Mantener compatibilidad con versión anterior
    return this.uploadFiles([file], projectId, period, testType);
  }

  async validateFiles(executionId) {
    try {
      const response = await api.post(`/api/import/validate/${executionId}`);
      return response.data;
    } catch (error) {
      console.error('Error validating files:', error);
      throw error;
    }
  }

  async convertFiles(executionId) {
    try {
      const response = await api.post(`/api/import/convert/${executionId}`);
      return response.data;
    } catch (error) {
      console.error('Error converting files:', error);
      throw error;
    }
  }

  async getImportHistory() {
    try {
      const response = await api.get('/api/import/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching import history:', error);
      throw error;
    }
  }

  async previewFile(executionId, filename) {
    try {
      const response = await api.get(`/api/import/preview/${executionId}`, {
        params: { filename }
      });
      return response.data;
    } catch (error) {
      console.error('Error previewing file:', error);
      throw error;
    }
  }

  async getExecutionDetails(executionId) {
    try {
      const response = await api.get(`/api/import/execution/${executionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting execution details:', error);
      throw error;
    }
  }

  async getExecutionStatus(executionId) {
    try {
      const response = await api.get(`/api/import/status/${executionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting execution status:', error);
      throw error;
    }
  }

  getDownloadUrl(filename) {
    return `${api.defaults.baseURL}/api/import/download/${filename}`;
  }

  downloadFile(filename) {
    try {
      const url = this.getDownloadUrl(filename);
      
      // Crear elemento temporal para descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank'; // Abrir en nueva pestaña como respaldo
      
      // Agregar al DOM temporalmente
      document.body.appendChild(link);
      
      // Simular clic para iniciar descarga
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      
      // Mostrar confirmación
      this.showDownloadNotification(filename);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error al descargar el archivo. Por favor, inténtalo de nuevo.');
    }
  }

  downloadFileBlob(filename, data) {
    try {
      // Crear blob con los datos JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento para descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Ejecutar descarga
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL del blob
      window.URL.revokeObjectURL(url);
      
      this.showDownloadNotification(filename);
      
    } catch (error) {
      console.error('Error downloading blob file:', error);
      alert('Error al descargar el archivo. Por favor, inténtalo de nuevo.');
    }
  }

  showDownloadNotification(filename) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span>Descargando ${filename}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Función para simular descarga con datos mock (para desarrollo)
  downloadMockFile(filename, executionId) {
    try {
      // Datos simulados para descarga
      const mockData = {
        metadata: {
          execution_id: executionId,
          filename: filename,
          conversion_date: new Date().toISOString(),
          format: "standard_accounting_json",
          total_records: Math.floor(Math.random() * 1000) + 100,
          source_files: filename.includes('merged') ? ['BKPF.txt', 'BSEG.txt'] : [filename]
        },
        headers: filename.includes('libro_diario') || filename.includes('merged') ? 
          ["fecha", "asiento", "cuenta", "subcuenta", "descripcion", "debe", "haber", "documento", "referencia"] :
          ["cuenta", "descripcion", "saldo_inicial_debe", "saldo_inicial_haber", "movimientos_debe", "movimientos_haber", "saldo_final_debe", "saldo_final_haber"],
        data: this.generateMockData(filename),
        summary: {
          processed_successfully: true,
          validation_passed: true,
          conversion_completed: true,
          ready_for_analysis: true,
          sap_merge_performed: filename.includes('merged')
        }
      };

      this.downloadFileBlob(filename, mockData);
    } catch (error) {
      console.error('Error downloading mock file:', error);
      alert('Error al generar el archivo de descarga.');
    }
  }

  generateMockData(filename) {
    const isLibroDiario = filename.includes('libro_diario') || filename.includes('merged');
    const mockData = [];
    const recordCount = Math.floor(Math.random() * 20) + 10; // Entre 10 y 30 registros

    for (let i = 0; i < recordCount; i++) {
      if (isLibroDiario) {
        mockData.push([
          `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          String(i + 1),
          String(Math.floor(Math.random() * 900000) + 100000),
          String(Math.floor(Math.random() * 9000000000) + 1000000000),
          filename.includes('merged') ? `SAP Merged Record ${i + 1}` : `Operación contable ${i + 1}`,
          Math.random() > 0.5 ? `${(Math.random() * 10000).toFixed(2)}` : "0.00",
          Math.random() > 0.5 ? `${(Math.random() * 10000).toFixed(2)}` : "0.00",
          `DOC${String(i + 1).padStart(4, '0')}`,
          filename.includes('merged') ? `OIVE-2023-${String(i + 1).padStart(3, '0')}` : `REF${String(i + 1).padStart(4, '0')}`
        ]);
      } else {
        const debeInicial = Math.random() * 50000;
        const haberInicial = Math.random() * 50000;
        const movDebe = Math.random() * 20000;
        const movHaber = Math.random() * 20000;
        
        mockData.push([
          String(Math.floor(Math.random() * 900000) + 100000),
          `Cuenta contable ${i + 1}`,
          debeInicial.toFixed(2),
          haberInicial.toFixed(2),
          movDebe.toFixed(2),
          movHaber.toFixed(2),
          Math.max(0, debeInicial + movDebe - movHaber).toFixed(2),
          Math.max(0, haberInicial + movHaber - movDebe).toFixed(2)
        ]);
      }
    }

    return mockData;
  }
}

export default new ImportService();