// alertRoutes.js
// Define las rutas REST para la gestión de alertas y las conecta con el
// alertController. Se monta bajo el prefijo /api/alerts.

const express = require('express');
const alertController = require('../controllers/alertController');

const router = express.Router();

// Alertas activas de un filtro.
router.get('/:filterId', alertController.getAlerts);

// Marcar una alerta como resuelta.
router.patch('/:alertId/resolve', alertController.resolveAlert);

module.exports = router;
