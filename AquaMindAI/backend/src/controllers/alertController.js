// alertController.js
// Controladores delgados para la gestión de alertas: consulta de alertas activas
// y resolución de una alerta. Delegan toda la consulta SQL a queries.js.

const queries = require('../database/queries');

/**
 * GET /api/alerts/:filterId
 * Devuelve las alertas activas (no resueltas) de un filtro.
 */
async function getAlerts(req, res, next) {
  try {
    const { filterId } = req.params;
    const alerts = await queries.getActiveAlerts(filterId);

    return res.status(200).json({
      filter_id: filterId,
      count: alerts.length,
      alerts,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/alerts/:alertId/resolve
 * Marca una alerta como resuelta. Responde 404 si la alerta no existe.
 */
async function resolveAlert(req, res, next) {
  try {
    const alertId = parseInt(req.params.alertId, 10);
    if (Number.isNaN(alertId)) {
      return res.status(400).json({ error: 'alertId inválido', status: 400 });
    }

    const updated = await queries.resolveAlert(alertId);
    if (!updated) {
      return res.status(404).json({ error: 'Alerta no encontrada', status: 404 });
    }

    return res.status(200).json({ alert: updated });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getAlerts, resolveAlert };
