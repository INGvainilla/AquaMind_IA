// FilterContext.jsx
// Contexto global que centraliza los datos del filtro (tiempo real + REST) y los
// expone a toda la app, evitando prop-drilling y duplicar suscripciones a sockets.

import { createContext, useContext, useMemo } from 'react';
import { FILTER_ID } from '../utils/constants';
import { useSensorData } from '../hooks/useSensorData';
import { useAlerts } from '../hooks/useAlerts';
import { useFilterStatus } from '../hooks/useFilterStatus';

const FilterContext = createContext(null);

/**
 * Proveedor que ejecuta los hooks de datos una sola vez y comparte sus valores.
 * @param {{ children: React.ReactNode }} props
 */
export function FilterProvider({ children }) {
  // Filtro monitoreado (constante en este MVP de un solo filtro).
  const filterId = FILTER_ID;

  // Datos de sensores en tiempo real (Socket.IO).
  const { sensorReadings, latestReading, isConnected } = useSensorData();

  // Alertas (carga REST inicial + evento 'alert:new' en vivo).
  const { alerts, hasUnread, resolveAlert } = useAlerts(filterId);

  // Estado completo del filtro vía REST (refrescado cada 10s).
  const { status: filterStatus, loading: statusLoading } = useFilterStatus(filterId);

  // useMemo evita recrear el objeto de contexto (y re-renderizar consumidores)
  // si las dependencias no cambiaron.
  const value = useMemo(
    () => ({
      // Identificador del filtro monitoreado.
      filterId,
      // Lecturas recientes de sensores (máx. 50) para gráficas/tablas.
      sensorReadings,
      // Última lectura recibida (para tarjetas de valor actual).
      latestReading,
      // Estado de la conexión WebSocket (indicador en vivo/desconectado).
      isConnected,
      // Lista de alertas activas del filtro.
      alerts,
      // Indica si hay alertas nuevas sin revisar.
      hasUnread,
      // Acción para marcar una alerta como resuelta.
      resolveAlert,
      // Estado agregado del filtro (último análisis + datos + alertas) vía REST.
      filterStatus,
      // Bandera de carga del estado REST.
      statusLoading,
    }),
    [
      filterId,
      sensorReadings,
      latestReading,
      isConnected,
      alerts,
      hasUnread,
      resolveAlert,
      filterStatus,
      statusLoading,
    ]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

/**
 * Hook de acceso al contexto del filtro.
 * @throws {Error} Si se usa fuera de un <FilterProvider>.
 * @returns {Object} Valores compartidos del filtro.
 */
export function useFilter() {
  const context = useContext(FilterContext);
  if (context === null) {
    throw new Error('useFilter debe usarse dentro de un <FilterProvider>.');
  }
  return context;
}

export default FilterContext;
