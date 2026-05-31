// StatusBadge.jsx
// Badge compacto que muestra el estado del filtro (NORMAL / ALERTA / CRITICO)
// con colores semánticos y un punto parpadeante para reforzar el "tiempo real".

import { getStatusBadgeClass } from '../utils/formatters';
import { STATUS_LABELS } from '../utils/constants';

// Color del punto indicador según el estado (mismo lenguaje cromático del badge).
const DOT_COLOR = {
  NORMAL: 'bg-green-400',
  ALERTA: 'bg-yellow-400',
  CRITICO: 'bg-red-400',
};

/**
 * @param {{ status?: string }} props - Estado del filtro.
 */
function StatusBadge({ status }) {
  const normalized = status || 'NORMAL';
  const label = STATUS_LABELS[normalized] || normalized;
  const dotColor = DOT_COLOR[normalized] || 'bg-gray-400';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClass(
        normalized
      )}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotColor} animate-pulse`} />
      {label}
    </span>
  );
}

export default StatusBadge;
