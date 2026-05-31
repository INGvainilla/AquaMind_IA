// aiService.js
// Cliente del microservicio de IA (Python/Flask). Envía las lecturas de sensores
// para su análisis predictivo y provee un fallback local si la IA no responde.

const axios = require('axios');
const { ENV } = require('../config/environment');

// Tiempo máximo de espera para la IA. Si se excede, usamos el fallback para no
// bloquear la respuesta al simulador ni la emisión en tiempo real al frontend.
const AI_TIMEOUT_MS = 5000;

// ----------------------------------------------------------------------------
// Fallback local
// La ingesta de datos NO debe detenerse si el servicio de IA está caído. Por eso
// devolvemos un análisis "neutro" por defecto: permite seguir guardando datos y
// mostrando algo coherente en el dashboard mientras la IA vuelve a estar disponible.
// ----------------------------------------------------------------------------
function buildFallbackAnalysis(sensorData) {
  return {
    filter_id: sensorData.filter_id,
    health_score: 75,
    risk_level: 'MEDIO',
    state: 'NORMAL',
    estimated_life: 'No disponible',
    recommendation: 'Análisis IA no disponible. Se aplicó evaluación por defecto.',
    anomaly_detected: false,
  };
}

/**
 * Solicita al servicio de IA el análisis de una lectura de sensores.
 * @param {Object} sensorData - Lectura a analizar (incluye filter_id y métricas).
 * @returns {Promise<Object>} Análisis de la IA o el fallback local si falla.
 */
async function analyzeData(sensorData) {
  try {
    const response = await axios.post(
      `${ENV.AI_SERVICE_URL}/analyze`,
      sensorData,
      { timeout: AI_TIMEOUT_MS }
    );

    // Aseguramos que el análisis incluya el filter_id para persistirlo luego.
    return { filter_id: sensorData.filter_id, ...response.data };
  } catch (err) {
    // Cualquier fallo (timeout, conexión rechazada, 5xx) activa el fallback.
    console.error('[aiService] IA no disponible, usando fallback:', err.message);
    return buildFallbackAnalysis(sensorData);
  }
}

module.exports = { analyzeData };
