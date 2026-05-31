// errorHandler.js
// Middleware global de manejo de errores de Express. Centraliza el formato de la
// respuesta de error y registra cada incidente con su timestamp.

/**
 * Captura cualquier error propagado por las rutas (vía next(err)).
 * @param {Error} err - Error capturado.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  // El status puede venir adjunto al error; por defecto es 500.
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  // Log con timestamp para facilitar el diagnóstico en producción.
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${status}: ${message}`);

  res.status(status).json({ error: message, status });
}

module.exports = errorHandler;
