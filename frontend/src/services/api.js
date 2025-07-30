// frontend/src/services/api.js - Configuración mejorada para desarrollo/producción
import axios from 'axios';

// Función para detectar el entorno y configurar la URL base
const getApiBaseUrl = () => {
  // 1. Prioridad: Variable de entorno explícita
  if (process.env.REACT_APP_API_URL) {
    console.log('🔧 Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // 2. En desarrollo, usar localhost:8000 por defecto
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: using localhost:8001');
    return 'http://localhost:8001';
  }

  // 3. En producción, usar la URL actual del navegador
  console.log('🚀 Production mode: using current origin');
  return window.location.origin;
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL: API_BASE_URL,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  CURRENT_ORIGIN: window.location.origin
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Solo mostrar logs detallados en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`
      });
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    // Solo mostrar logs detallados en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API Response:', {
        status: response.status,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      data: error.response?.data
    });
    
    if (error.response) {
      // El servidor respondió con un código de error
      if (process.env.NODE_ENV === 'development') {
        console.error('Error Response Data:', error.response.data);
        console.error('Error Response Status:', error.response.status);
      }
      
      // Personalizar mensajes de error comunes
      switch (error.response.status) {
        case 404:
          error.message = 'Recurso no encontrado';
          break;
        case 500:
          error.message = 'Error interno del servidor';
          break;
        case 503:
          error.message = 'Servicio no disponible';
          break;
        case 0:
        case undefined:
          error.message = 'No se pudo conectar con el servidor. ¿Está el backend ejecutándose?';
          break;
      }
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('No Response Received:', error.request);
      error.message = `No se pudo conectar con el servidor en ${API_BASE_URL}. Verificar que el backend esté ejecutándose.`;
    } else {
      // Error en la configuración de la petición
      console.error('Request Configuration Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Función para verificar conexión con el backend
export const checkBackendConnection = async () => {
  try {
    const response = await api.get('/api/health');
    console.log('✅ Backend connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
};

// En desarrollo, verificar conexión automáticamente
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    checkBackendConnection().then(connected => {
      if (!connected) {
        console.warn(`
⚠️  No se pudo conectar al backend en ${API_BASE_URL}
   Asegúrate de que el backend esté ejecutándose:
   
   cd backend
   DEVELOPMENT_MODE=true SERVE_FRONTEND=false python main.py
   
   O usa el script: ./run-dev-backend.sh
        `);
      }
    });
  }, 1000);
}

export default api;