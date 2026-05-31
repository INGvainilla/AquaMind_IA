// FilterHeader.jsx
// Cabecera del dashboard: nombre del filtro, estado actual, indicador de conexión
// en tiempo real y marca de la última actualización recibida.

import StatusBadge from './StatusBadge';
import ConnectionStatus from './ConnectionStatus';
import { formatTimestamp } from '../utils/formatters';

/**
 * @param {{
 *   filterId: string,
 *   status?: string,
 *   isConnected?: boolean,
 *   lastUpdate?: string,
 * }} props
 */
function FilterHeader({ filterId, status, isConnected, lastUpdate }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="text-cyan-400 text-xl">≋</span>
        <div>
          <h1 className="font-mono text-lg font-bold tracking-tight text-gray-100">
            {filterId}
          </h1>
          <p className="text-xs text-gray-500">Monitoreo predictivo · AquaMind AI</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdate && (
          <span className="hidden font-mono text-xs text-gray-500 sm:inline">
            Últ. act. {formatTimestamp(lastUpdate)}
          </span>
        )}
        <StatusBadge status={status} />
        <ConnectionStatus isConnected={isConnected} />
      </div>
    </header>
  );
}

export default FilterHeader;
