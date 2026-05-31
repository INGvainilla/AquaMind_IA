// requestLogger.js
// Middleware ligero de logging de peticiones HTTP. Solo registra fuera de
// producción para no ensuciar los logs ni afectar el rendimiento en prod.

const { ENV } = require('../config/environment');

/**
 * Registra método, URL y timestamp de cada request entrante.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requestLogger(req, res, next) {
  if (ENV.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
}

module.exports = requestLogger;
