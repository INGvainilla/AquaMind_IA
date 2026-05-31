// server.js
// Punto de entrada del backend de AquaMind: arma la app Express, monta rutas y
// middleware, levanta Socket.IO sobre el mismo servidor HTTP y empieza a escuchar.

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { ENV } = require('./config/environment');
const { query } = require('./config/database');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const sensorRoutes = require('./routes/sensorRoutes');
const alertRoutes = require('./routes/alertRoutes');
const { initializeSockets } = require('./sockets/socketManager');

// ----------------------------------------------------------------------------
// App y servidor HTTP
// Socket.IO necesita engancharse a un servidor http nativo, así que creamos uno
// explícito a partir de la app de Express.
// ----------------------------------------------------------------------------
const app = express();
const server = http.createServer(app);

// ----------------------------------------------------------------------------
// Socket.IO
// El CORS del socket usa el mismo origen permitido que la API REST.
// Guardamos la instancia `io` en la app para que los controllers la recuperen
// con req.app.get('io') sin acoplarse a un singleton global.
// ----------------------------------------------------------------------------
const io = new Server(server, {
  cors: { origin: ENV.FRONTEND_URL, methods: ['GET', 'POST'] },
});
app.set('io', io);
initializeSockets(io);

// ----------------------------------------------------------------------------
// Middleware global
// ----------------------------------------------------------------------------
app.use(cors({ origin: ENV.FRONTEND_URL }));
app.use(express.json());
app.use(requestLogger);

// ----------------------------------------------------------------------------
// Rutas
// ----------------------------------------------------------------------------
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Estado del sistema: verifica la conectividad real con PostgreSQL y reporta la
// configuración relevante. Útil para diagnosticar el entorno antes de la demo.
app.get('/api/health', async (req, res) => {
  let database = 'desconectada';
  try {
    await query('SELECT 1');
    database = 'conectada';
  } catch (err) {
    database = 'desconectada';
  }

  return res.status(200).json({
    status: 'ok',
    service: 'AquaMind Backend',
    uptime_seconds: Math.round(process.uptime()),
    database,
    ai_service_url: ENV.AI_SERVICE_URL,
    frontend_url: ENV.FRONTEND_URL,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);

// ----------------------------------------------------------------------------
// Manejo de errores (siempre al final, después de las rutas).
// ----------------------------------------------------------------------------
app.use(errorHandler);

// ----------------------------------------------------------------------------
// Arranque
// Solo escuchamos si el archivo se ejecuta directamente; al importarlo en tests
// se obtiene { app, io } sin abrir un puerto.
// ----------------------------------------------------------------------------
if (require.main === module) {
  server.listen(ENV.PORT, () => {
    console.log(`🚀 AquaMind Backend corriendo en puerto ${ENV.PORT}`);
  });
}

module.exports = { app, io, server };
