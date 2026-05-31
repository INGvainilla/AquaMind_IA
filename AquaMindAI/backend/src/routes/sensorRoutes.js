// sensorRoutes.js
// Define las rutas REST relacionadas con los sensores y las conecta con los
// métodos del sensorController. Se monta bajo el prefijo /api/sensors.

const express = require('express');
const sensorController = require('../controllers/sensorController');

const router = express.Router();

// Ingesta de datos enviados por el simulador de sensores.
router.post('/data', sensorController.receiveSensorData);

// Estado actual de un filtro (último análisis + datos + alertas activas).
router.get('/:filterId/status', sensorController.getFilterStatus);

// Historial de lecturas de un filtro.
router.get('/:filterId/history', sensorController.getSensorHistory);

module.exports = router;
