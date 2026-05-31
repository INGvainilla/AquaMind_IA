// sensorController.js
// Controladores delgados para el flujo de sensores: reciben la petición, delegan
// en services/queries y devuelven la respuesta HTTP. Sin lógica SQL ni de negocio.

const queries = require('../database/queries');
const aiService = require('../services/aiService');
const alertService = require('../services/alertService');
const { emitSensorUpdate } = require('../sockets/socketManager');

// Campos mínimos que debe traer una lectura para considerarse válida.
const REQUIRED_FIELDS = ['filter_id', 'turbidity', 'pressure', 'flow_rate', 'temperature'];

/**
 * POST /api/sensors/data
 * Recibe una lectura del simulador: la persiste, la analiza con la IA, evalúa
 * alertas, emite todo por Socket.IO y responde con los datos guardados.
 */
async function receiveSensorData(req, res, next) {
  try {
    const body = req.body || {};

    // Validación de campos requeridos (no permitimos null/undefined).
    const missing = REQUIRED_FIELDS.filter((f) => body[f] === undefined || body[f] === null);
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Faltan campos requeridos: ${missing.join(', ')}`,
        status: 400,
      });
    }

    // 1) Guardar la lectura cruda.
    const sensorData = await queries.insertSensorData(body);

    // 2) Analizar con la IA (con fallback interno si la IA no responde).
    const analysisResult = await aiService.analyzeData(sensorData);

    // 3) Persistir el análisis.
    const analysis = await queries.insertAnalysis(analysisResult);

    // 4) Evaluar y, si corresponde, crear una alerta. Le pasamos `io` para que
    //    el service emita 'alert:new' y dispare el correo (con cooldown) él mismo.
    const io = req.app.get('io');
    const alert = await alertService.checkAndCreateAlerts(
      sensorData,
      analysis,
      sensorData.filter_id,
      io
    );

    // 5) Emitir la actualización de sensores en tiempo real al frontend.
    //    (La emisión de 'alert:new' la realiza alertService al recibir `io`.)
    if (io) {
      emitSensorUpdate(io, { sensor: sensorData, analysis });
    }

    // 6) Responder con todo lo guardado.
    return res.status(201).json({ sensor: sensorData, analysis, alert });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/sensors/:filterId/status
 * Devuelve el panorama actual de un filtro: último análisis, últimas lecturas
 * y alertas activas.
 */
async function getFilterStatus(req, res, next) {
  try {
    const { filterId } = req.params;

    const [analysis, latestData, activeAlerts] = await Promise.all([
      queries.getLatestAnalysis(filterId),
      queries.getLatestSensorData(filterId, 50),
      queries.getActiveAlerts(filterId),
    ]);

    return res.status(200).json({
      filter_id: filterId,
      analysis,
      latest_data: latestData,
      active_alerts: activeAlerts,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/sensors/:filterId/history?hours=24
 * Devuelve el historial de lecturas dentro de la ventana de tiempo indicada.
 */
async function getSensorHistory(req, res, next) {
  try {
    const { filterId } = req.params;
    const hours = parseInt(req.query.hours, 10) || 24;

    const history = await queries.getSensorHistory(filterId, hours);

    return res.status(200).json({
      filter_id: filterId,
      hours,
      count: history.length,
      history,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { receiveSensorData, getFilterStatus, getSensorHistory };
