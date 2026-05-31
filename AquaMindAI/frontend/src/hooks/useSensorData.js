// useSensorData.js
// Hook que gestiona el flujo de datos de sensores en tiempo real vía Socket.IO,
// manteniendo las últimas lecturas, la lectura más reciente y el estado de conexión.

import { useState, useEffect, useCallback } from 'react';
import socket from '../services/socket';

// Máximo de lecturas conservadas en memoria para no crecer indefinidamente.
const MAX_READINGS = 50;

/**
 * Suscribe la UI al evento 'sensor:update' del backend.
 * @returns {{ sensorReadings: Array, latestReading: Object|null, isConnected: boolean, error: string|null }}
 */
export function useSensorData() {
  const [sensorReadings, setSensorReadings] = useState([]);
  const [latestReading, setLatestReading] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Handler estable (useCallback) para poder removerlo en el cleanup.
  const handleSensorUpdate = useCallback((payload) => {
    // El backend emite { sensor, analysis }; normalizamos a una sola lectura.
    const reading = {
      ...(payload?.sensor || {}),
      analysis: payload?.analysis || null,
    };
    setLatestReading(reading);
    setSensorReadings((prev) => {
      const next = [...prev, reading];
      // Conservar solo las últimas MAX_READINGS lecturas.
      return next.length > MAX_READINGS ? next.slice(-MAX_READINGS) : next;
    });
  }, []);

  const handleConnect = useCallback(() => setIsConnected(true), []);
  const handleDisconnect = useCallback(() => setIsConnected(false), []);
  const handleConnectError = useCallback((err) => {
    setError(err?.message || 'Error de conexión con el servidor');
    setIsConnected(false);
  }, []);

  useEffect(() => {
    // Registrar listeners y abrir la conexión al montar.
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('sensor:update', handleSensorUpdate);
    socket.connect();

    // Cleanup: quitamos SOLO nuestros listeners y desconectamos al desmontar,
    // evitando fugas de memoria y handlers duplicados en re-montajes.
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('sensor:update', handleSensorUpdate);
      socket.disconnect();
    };
  }, [handleConnect, handleDisconnect, handleConnectError, handleSensorUpdate]);

  return { sensorReadings, latestReading, isConnected, error };
}

export default useSensorData;
