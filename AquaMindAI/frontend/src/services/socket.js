// socket.js
// Instancia única del cliente Socket.IO usada para recibir datos en tiempo real
// (eventos 'sensor:update' y 'alert:new') desde el backend.

import { io } from 'socket.io-client';

// Mismo origen que la API REST.
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// autoConnect: false porque queremos controlar el ciclo de conexión desde los
// hooks (conectar al montar el componente y desconectar al desmontar), evitando
// conexiones abiertas mientras no haya UI escuchando.
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
});

export default socket;
