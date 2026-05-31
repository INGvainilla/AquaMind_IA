// alertService.js
// Lógica de negocio para la generación de alertas a partir del análisis de IA.
// Decide la severidad según el estado del filtro y persiste la alerta resultante.

const { insertAlert } = require('../database/queries');

// Mapeo del estado del análisis -> configuración de la alerta a crear.
// Solo los estados 'CRITICO' y 'ALERTA' generan alerta; 'NORMAL' no.
const STATE_TO_ALERT = {
  CRITICO: { severity: 'ALTA', alert_type: 'ESTADO_CRITICO' },
  ALERTA: { severity: 'MEDIA', alert_type: 'ESTADO_ALERTA' },
};

/**
 * Evalúa un análisis y crea una alerta si el estado lo amerita.
 * @param {Object} sensorData - Lectura de sensores que originó el análisis.
 * @param {Object} analysis - Resultado del análisis (debe incluir `state`).
 * @param {string} filterId - Identificador del filtro.
 * @returns {Promise<Object|null>} La alerta creada o null si no corresponde crearla.
 */
async function checkAndCreateAlerts(sensorData, analysis, filterId) {
  try {
    const state = analysis && analysis.state;
    const config = STATE_TO_ALERT[state];

    // Estado normal o desconocido: no se crea ninguna alerta.
    if (!config) {
      return null;
    }

    const alert = await insertAlert({
      filter_id: filterId,
      alert_type: config.alert_type,
      severity: config.severity,
      message:
        analysis.recommendation ||
        `Filtro ${filterId} en estado ${state}. Revisión recomendada.`,
      // Guardamos las métricas del sensor que motivaron la alerta para auditoría.
      sensor_values: {
        turbidity: sensorData.turbidity,
        pressure: sensorData.pressure,
        flow_rate: sensorData.flow_rate,
        temperature: sensorData.temperature,
      },
    });

    return alert;
  } catch (err) {
    console.error('[alertService] Error creando alerta:', err.message);
    throw err;
  }
}

module.exports = { checkAndCreateAlerts };
