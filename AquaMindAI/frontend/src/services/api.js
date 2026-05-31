// api.js
// Cliente HTTP centralizado (axios) para consumir la API REST del backend.
// Define interceptores comunes y expone funciones tipadas por endpoint.

import axios from 'axios';

// URL base del backend; configurable por entorno, con fallback a localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor de request: garantiza el header JSON en cada petición.
apiClient.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: loguea el error y lo re-lanza para que cada
// llamador (hook) pueda manejarlo según su contexto.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[api] Error en la petición:', error?.message || error);
    return Promise.reject(error);
  }
);

/**
 * Obtiene el estado completo de un filtro (último análisis, datos y alertas).
 * @param {string} filterId - Identificador del filtro.
 * @returns {Promise<Object>} Datos del estado del filtro.
 */
export async function getFilterStatus(filterId) {
  const { data } = await apiClient.get(`/api/sensors/${filterId}/status`);
  return data;
}

/**
 * Obtiene el historial de lecturas de un filtro.
 * @param {string} filterId - Identificador del filtro.
 * @param {number} [hours=24] - Ventana de tiempo hacia atrás, en horas.
 * @returns {Promise<Object>} Historial de lecturas.
 */
export async function getSensorHistory(filterId, hours = 24) {
  const { data } = await apiClient.get(`/api/sensors/${filterId}/history`, {
    params: { hours },
  });
  return data;
}

/**
 * Obtiene las alertas activas de un filtro.
 * @param {string} filterId - Identificador del filtro.
 * @returns {Promise<Object>} Alertas activas.
 */
export async function getAlerts(filterId) {
  const { data } = await apiClient.get(`/api/alerts/${filterId}`);
  return data;
}

/**
 * Marca una alerta como resuelta.
 * @param {number|string} alertId - Identificador de la alerta.
 * @returns {Promise<Object>} Alerta actualizada.
 */
export async function resolveAlert(alertId) {
  const { data } = await apiClient.patch(`/api/alerts/${alertId}/resolve`);
  return data;
}

export default apiClient;
