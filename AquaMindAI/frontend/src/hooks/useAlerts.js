// useAlerts.js
// Hook que combina la carga REST de alertas activas con la recepción en tiempo
// real (evento 'alert:new') y permite resolver alertas actualizando el estado local.

import { useState, useEffect, useCallback } from 'react';
import socket from '../services/socket';
import { getAlerts, resolveAlert as resolveAlertApi } from '../services/api';

/**
 * Gestiona las alertas de un filtro (REST inicial + tiempo real).
 * @param {string} filterId - Identificador del filtro a observar.
 * @returns {{ alerts: Array, hasUnread: boolean, resolveAlert: Function, loading: boolean }}
 */
export function useAlerts(filterId) {
  const [alerts, setAlerts] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handler estable para el evento 'alert:new'; se remueve en el cleanup.
  const handleNewAlert = useCallback((alert) => {
    setAlerts((prev) => [alert, ...prev]);
    // Una alerta recién llegada queda como "no leída" hasta que la UI la procese.
    setHasUnread(true);
  }, []);

  // Carga inicial de alertas activas vía REST al montar o cambiar de filtro.
  useEffect(() => {
    let cancelled = false;
    async function loadAlerts() {
      setLoading(true);
      try {
        const response = await getAlerts(filterId);
        if (!cancelled) {
          setAlerts(response?.alerts || []);
        }
      } catch (err) {
        if (!cancelled) setAlerts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAlerts();
    // Evita actualizar estado si el efecto se limpia antes de resolver la promesa.
    return () => {
      cancelled = true;
    };
  }, [filterId]);

  // Suscripción al evento de alertas en tiempo real.
  useEffect(() => {
    socket.on('alert:new', handleNewAlert);
    // Cleanup: removemos únicamente nuestro listener (la conexión la administra
    // useSensorData, dueño del ciclo de vida del socket).
    return () => {
      socket.off('alert:new', handleNewAlert);
    };
  }, [handleNewAlert]);

  /**
   * Resuelve una alerta en el backend y la quita del estado local.
   * @param {number|string} alertId - Identificador de la alerta a resolver.
   */
  const resolveAlert = useCallback(async (alertId) => {
    try {
      await resolveAlertApi(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setHasUnread(false);
    } catch (err) {
      console.error('[useAlerts] No se pudo resolver la alerta:', err?.message);
    }
  }, []);

  return { alerts, hasUnread, resolveAlert, loading };
}

export default useAlerts;
