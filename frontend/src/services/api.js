// frontend/src/services/api.js - Configuración para producción
import axios from 'axios';

// Configurar la URL base según el entorno
const getApiBaseUrl = () => {
  // En producción, la API está en el mismo dominio
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin; // Usar la URL actual del navegador
  }
  // En desarrollo, usar localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL: API_BASE_URL,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentar timeout para producción
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests - agregar logs
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses - mejorar manejo de errores
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      data: response.data
    });
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
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
      
      // Personalizar mensajes de error comunes
      if (error.response.status === 404) {
        error.message = 'Recurso no encontrado';
      } else if (error.response.status === 500) {
        error.message = 'Error interno del servidor';
      } else if (error.response.status === 503) {
        error.message = 'Servicio no disponible';
      }
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('No Response Received:', error.request);
      error.message = 'No se pudo conectar con el servidor';
    } else {
      // Error en la configuración de la petición
      console.error('Request Configuration Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;