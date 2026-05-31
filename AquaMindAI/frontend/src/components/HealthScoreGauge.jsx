// HealthScoreGauge.jsx
// Medidor circular (SVG puro, sin librerías) del health score del filtro (0-100).
// El arco cambia de color por rango: verde (>60), amarillo (30-60), rojo (<30).

import { STATUS_LABELS } from '../utils/constants';

const SIZE = 180;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Color del arco según el puntaje.
 * @param {number} score
 * @returns {string} color hex
 */
function arcColor(score) {
  if (score > 60) return '#22c55e';
  if (score >= 30) return '#eab308';
  return '#ef4444';
}

/**
 * @param {{ score?: number|null, state?: string }} props
 */
function HealthScoreGauge({ score, state }) {
  const hasScore = score !== null && score !== undefined && !Number.isNaN(score);
  const safeScore = hasScore ? Math.max(0, Math.min(100, Number(score))) : 0;
  const color = hasScore ? arcColor(safeScore) : '#374151';
  // Longitud del trazo "lleno" en función del porcentaje.
  const dashOffset = CIRCUMFERENCE - (safeScore / 100) * CIRCUMFERENCE;
  const stateLabel = state ? STATUS_LABELS[state] || state : '';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-800 bg-gray-900 p-5">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Pista de fondo */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#1f2937"
            strokeWidth={STROKE}
          />
          {/* Arco de progreso */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Número central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-5xl font-bold"
            style={{ color: hasScore ? color : '#6b7280' }}
          >
            {hasScore ? Math.round(safeScore) : '--'}
          </span>
          <span className="font-mono text-xs text-gray-500">/ 100</span>
        </div>
      </div>

      <p className="mt-3 text-sm font-medium text-gray-400">Estado del Filtro</p>
      {stateLabel && (
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
          {stateLabel}
        </p>
      )}
    </div>
  );
}

export default HealthScoreGauge;
