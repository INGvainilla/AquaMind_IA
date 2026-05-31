// database.js
// Configura el pool de conexiones a PostgreSQL usando el paquete `pg`.
// Expone helpers `query` y `getClient` para el resto de la aplicación.

const { Pool } = require('pg');
const { ENV } = require('./environment');

// ----------------------------------------------------------------------------
// Pool de conexiones
// Reutiliza conexiones abiertas en lugar de crear una nueva por cada consulta,
// lo que mejora el rendimiento bajo carga. Las credenciales se leen del objeto
// ENV (que a su vez proviene de process.env).
// ----------------------------------------------------------------------------
const pool = new Pool({
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  database: ENV.DB_NAME,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  max: 10, // máximo de conexiones simultáneas en el pool
  idleTimeoutMillis: 30000, // cerrar conexiones inactivas tras 30s
  connectionTimeoutMillis: 5000, // abortar si no conecta en 5s
});

// ----------------------------------------------------------------------------
// Manejo de errores de conexión
// El pool emite 'error' cuando un cliente inactivo falla (p. ej. la base de
// datos se reinicia). Lo registramos para no perder visibilidad del problema.
// ----------------------------------------------------------------------------
pool.on('error', (err) => {
  console.error('[database] Error inesperado en el pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta una consulta SQL usando el pool.
 * @param {string} text - Sentencia SQL con placeholders ($1, $2, ...).
 * @param {Array} [params] - Valores para los placeholders.
 * @returns {Promise<import('pg').QueryResult>} Resultado de la consulta.
 */
async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('[database] Error ejecutando consulta:', err.message);
    throw err;
  }
}

/**
 * Obtiene un cliente dedicado del pool para transacciones (BEGIN/COMMIT).
 * IMPORTANTE: quien lo solicita es responsable de llamar a client.release().
 * @returns {Promise<import('pg').PoolClient>} Cliente del pool.
 */
async function getClient() {
  try {
    return await pool.connect();
  } catch (err) {
    console.error('[database] Error obteniendo cliente del pool:', err.message);
    throw err;
  }
}

module.exports = { pool, query, getClient };
