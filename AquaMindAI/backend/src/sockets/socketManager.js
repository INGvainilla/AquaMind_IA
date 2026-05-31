// socketManager.js
// Configura Socket.IO y centraliza la emisión de eventos en tiempo real hacia
// el frontend (actualizaciones de sensores y nuevas alertas).

/**
 * Registra los manejadores base de Socket.IO sobre la instancia `io`.
 * @param {import('socket.io').Server} io - Servidor de Socket.IO.
 */
function initializeSockets(io) {
  // Evento 'connection': se dispara cada vez que un cliente (frontend) abre un
  // canal WebSocket. Lo registramos para tener visibilidad de los conectados.
  io.on('connection', (socket) => {
    console.log(`[socket] Cliente conectado: ${socket.id}`);

    // Evento 'disconnect': el cliente cerró la pestaña o perdió conexión.
    // Útil para depurar reconexiones y monitorear clientes activos.
    socket.on('disconnect', (reason) => {
      console.log(`[socket] Cliente desconectado: ${socket.id} (${reason})`);
    });
  });
}

/**
 * Emite una actualización de sensores a todos los clientes conectados.
 * El frontend escucha 'sensor:update' para refrescar el dashboard en vivo.
 * @param {import('socket.io').Server} io - Servidor de Socket.IO.
 * @param {Object} data - Datos a difundir (lectura + análisis).
 */
function emitSensorUpdate(io, data) {
  io.emit('sensor:update', data);
}

/**
 * Emite una nueva alerta a todos los clientes conectados.
 * El frontend escucha 'alert:new' para mostrar notificaciones inmediatas.
 * @param {import('socket.io').Server} io - Servidor de Socket.IO.
 * @param {Object} alert - Alerta recién creada.
 */
function emitAlert(io, alert) {
  io.emit('alert:new', alert);
}

module.exports = { initializeSockets, emitSensorUpdate, emitAlert };
