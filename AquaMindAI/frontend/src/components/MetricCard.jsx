// MetricCard.jsx
// Tarjeta de un sensor en tiempo real: valor grande monospace, unidad, ícono de
// tendencia y borde izquierdo coloreado según el estado del filtro.

// Mapa de estado -> color del borde izquierdo (acento SCADA).
const BORDER_COLOR = {
  NORMAL: 'border-l-green-500',
  ALERTA: 'border-l-yellow-500',
  CRITICO: 'border-l-red-500',
};

// Ícono + color por tendencia (Unicode, sin librerías externas).
const TREND = {
  subiendo: { icon: '↑', color: 'text-red-400' },
  bajando: { icon: '↓', color: 'text-cyan-400' },
  estable: { icon: '→', color: 'text-gray-500' },
};

/**
 * @param {{
 *   label: string,
 *   value: number|null,
 *   unit: string,
 *   trend?: 'subiendo'|'bajando'|'estable',
 *   status?: string,
 * }} props
 */
function MetricCard({ label, value, unit, trend = 'estable', status = 'NORMAL' }) {
  const borderColor = BORDER_COLOR[status] || 'border-l-gray-700';
  const trendInfo = TREND[trend] || TREND.estable;
  const hasValue = value !== null && value !== undefined && !Number.isNaN(value);
  const displayValue = hasValue ? Number(value).toFixed(1) : '--';

  return (
    <div
      className={`rounded-lg border border-gray-800 border-l-4 ${borderColor} bg-gray-900 p-4 transition-colors duration-300`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </span>
        <span className={`text-sm ${trendInfo.color}`} title={trend}>
          {trendInfo.icon}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          key={displayValue}
          className="font-mono text-3xl font-semibold text-gray-100 transition-all duration-300"
        >
          {displayValue}
        </span>
        <span className="font-mono text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
}

export default MetricCard;
