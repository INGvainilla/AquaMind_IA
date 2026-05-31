// queries.js
// Capa de acceso a datos: funciones puras de SQL sobre las tablas de AquaMind.
// No contiene lógica de negocio, solo construye y ejecuta sentencias parametrizadas.

const { query } = require('../config/database');

/**
 * Inserta una lectura de sensores en la tabla sensor_data.
 * @param {Object} data - Lectura del sensor.
 * @param {string} data.filter_id - Identificador del filtro.
 * @param {number} [data.turbidity] - Turbidez medida.
 * @param {number} [data.pressure] - Presión medida.
 * @param {number} [data.flow_rate] - Caudal medido.
 * @param {number} [data.temperature] - Temperatura medida.
 * @param {string} [data.status] - Estado reportado por el sensor.
 * @returns {Promise<Object>} La fila insertada.
 */
async function insertSensorData(data) {
  // 1. Insertar el nuevo registro.
  const insertResult = await query(
    `INSERT INTO sensor_data (filter_id, turbidity, pressure, flow_rate, temperature, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.filter_id,
      data.turbidity,
      data.pressure,
      data.flow_rate,
      data.temperature,
      data.status || 'NORMAL',
    ]
  );

  // 2. Borrar registros viejos, conservando solo los últimos 300 por filtro.
  //    El simulador genera 1 lectura/segundo, así que sin esto la tabla crece
  //    sin control. El DELETE va en su propio try/catch: si falla, se loguea
  //    pero NUNCA interrumpe el flujo de ingesta (la lectura ya quedó guardada).
  try {
    await query(
      `DELETE FROM sensor_data
       WHERE filter_id = $1
         AND id NOT IN (
           SELECT id FROM sensor_data
           WHERE filter_id = $1
           ORDER BY recorded_at DESC
           LIMIT 300
         )`,
      [data.filter_id]
    );
  } catch (err) {
    console.error('[queries] Error limpiando registros viejos (no crítico):', err.message);
  }

  return insertResult.rows[0];
}

/**
 * Inserta el resultado de un análisis de IA en la tabla analysis.
 * @param {Object} data - Resultado del análisis.
 * @param {string} data.filter_id - Identificador del filtro.
 * @param {number} [data.health_score] - Puntaje de salud (0-100).
 * @param {string} [data.risk_level] - Nivel de riesgo (BAJO/MEDIO/ALTO).
 * @param {string} [data.estimated_life] - Vida útil estimada.
 * @param {string} [data.state] - Estado (NORMAL/ALERTA/CRITICO).
 * @param {string} [data.recommendation] - Recomendación de mantenimiento.
 * @param {boolean} [data.anomaly_detected] - Si se detectó anomalía.
 * @returns {Promise<Object>} La fila insertada.
 */
async function insertAnalysis(data) {
  const sql = `
    INSERT INTO analysis
      (filter_id, health_score, risk_level, estimated_life, state, recommendation, anomaly_detected)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const params = [
    data.filter_id,
    data.health_score,
    data.risk_level,
    data.estimated_life,
    data.state,
    data.recommendation,
    data.anomaly_detected,
  ];
  const result = await query(sql, params);
  return result.rows[0];
}

/**
 * Inserta una alerta en la tabla alerts.
 * @param {Object} data - Datos de la alerta.
 * @param {string} data.filter_id - Identificador del filtro.
 * @param {string} [data.alert_type] - Tipo de alerta.
 * @param {string} [data.severity] - Severidad (BAJA/MEDIA/ALTA).
 * @param {string} [data.message] - Mensaje descriptivo.
 * @param {Object} [data.sensor_values] - Valores de sensor que originaron la alerta.
 * @returns {Promise<Object>} La fila insertada.
 */
async function insertAlert(data) {
  const sql = `
    INSERT INTO alerts (filter_id, alert_type, severity, message, sensor_values)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const params = [
    data.filter_id,
    data.alert_type,
    data.severity,
    data.message,
    // Serializamos a JSON porque la columna es de tipo JSONB.
    data.sensor_values ? JSON.stringify(data.sensor_values) : null,
  ];
  const result = await query(sql, params);
  return result.rows[0];
}

/**
 * Obtiene las últimas N lecturas de sensores de un filtro (más recientes primero).
 * @param {string} filterId - Identificador del filtro.
 * @param {number} [limit=50] - Cantidad máxima de registros.
 * @returns {Promise<Array<Object>>} Lista de lecturas.
 */
async function getLatestSensorData(filterId, limit = 50) {
  const sql = `
    SELECT * FROM sensor_data
    WHERE filter_id = $1
    ORDER BY recorded_at DESC
    LIMIT $2;
  `;
  const result = await query(sql, [filterId, limit]);
  return result.rows;
}

/**
 * Obtiene el último análisis registrado para un filtro.
 * @param {string} filterId - Identificador del filtro.
 * @returns {Promise<Object|null>} El análisis más reciente o null si no existe.
 */
async function getLatestAnalysis(filterId) {
  const sql = `
    SELECT * FROM analysis
    WHERE filter_id = $1
    ORDER BY analyzed_at DESC
    LIMIT 1;
  `;
  const result = await query(sql, [filterId]);
  return result.rows[0] || null;
}

/**
 * Obtiene las alertas activas (no resueltas) de un filtro.
 * @param {string} filterId - Identificador del filtro.
 * @returns {Promise<Array<Object>>} Lista de alertas sin resolver.
 */
async function getActiveAlerts(filterId) {
  const sql = `
    SELECT * FROM alerts
    WHERE filter_id = $1 AND resolved = FALSE
    ORDER BY created_at DESC;
  `;
  const result = await query(sql, [filterId]);
  return result.rows;
}

/**
 * Marca una alerta como resuelta.
 * @param {number} alertId - Identificador de la alerta.
 * @returns {Promise<Object|null>} La alerta actualizada o null si no existe.
 */
async function resolveAlert(alertId) {
  const sql = `
    UPDATE alerts
    SET resolved = TRUE
    WHERE id = $1
    RETURNING *;
  `;
  const result = await query(sql, [alertId]);
  return result.rows[0] || null;
}

/**
 * Obtiene el historial de lecturas de un filtro dentro de las últimas N horas.
 * @param {string} filterId - Identificador del filtro.
 * @param {number} [hours=24] - Ventana de tiempo hacia atrás, en horas.
 * @returns {Promise<Array<Object>>} Lecturas ordenadas cronológicamente.
 */
async function getSensorHistory(filterId, hours = 24) {
  const sql = `
    SELECT * FROM sensor_data
    WHERE filter_id = $1
      AND recorded_at >= NOW() - ($2 || ' hours')::INTERVAL
    ORDER BY recorded_at ASC;
  `;
  const result = await query(sql, [filterId, hours]);
  return result.rows;
}

module.exports = {
  insertSensorData,
  insertAnalysis,
  insertAlert,
  getLatestSensorData,
  getLatestAnalysis,
  getActiveAlerts,
  resolveAlert,
  getSensorHistory,
};
