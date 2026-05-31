// useFilterStatus.js
// Hook que obtiene vía REST el estado completo de un filtro (último análisis,
// últimas lecturas y alertas activas) y lo refresca periódicamente.

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFilterStatus } from '../services/api';

// Intervalo de refresco automático del estado (ms).
const REFRESH_INTERVAL_MS = 10000;

/**
 * Obtiene y mantiene actualizado el estado de un filtro.
 * @param {string} filterId - Identificador del filtro.
 * @returns {{ status: Object|null, loading: boolean, error: string|null, refresh: Function }}
 */
export function useFilterStatus(filterId) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Evita actualizar estado tras desmontar (las peticiones pueden seguir vivas).
  const isMountedRef = useRef(true);

  // refresh estable: reutilizable por el intervalo y por consumidores externos.
  const refresh = useCallback(async () => {
    try {
      const data = await getFilterStatus(filterId);
      if (isMountedRef.current) {
        setStatus(data);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err?.message || 'No se pudo obtener el estado del filtro');
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [filterId]);

  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);
    refresh();

    // Refresco periódico mientras el componente esté montado.
    const intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);

    // Cleanup: detener el intervalo y marcar como desmontado.
    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [refresh]);

  return { status, loading, error, refresh };
}

export default useFilterStatus;
