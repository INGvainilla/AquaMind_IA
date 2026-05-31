// SensorChart.jsx
// Gráfico de línea en tiempo real (Recharts) para una métrica de sensor.
// Fondo transparente, grid sutil y tooltip personalizado con valor + hora.

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatTimestamp } from '../utils/formatters';

// Cantidad de puntos visibles (últimas N lecturas).
const MAX_POINTS = 30;

/**
 * Tooltip personalizado: tarjeta oscura con valor monospace + unidad + hora.
 */
function CustomTooltip({ active, payload, unit }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  return (
    <div className="rounded-md border border-gray-700 bg-gray-900/95 px-3 py-2 shadow-lg">
      <p className="font-mono text-sm font-semibold text-gray-100">
        {Number(point.value).toFixed(2)}
        <span className="ml-1 text-xs text-gray-400">{unit}</span>
      </p>
      <p className="font-mono text-[11px] text-gray-500">
        {formatTimestamp(point.payload?.recorded_at)}
      </p>
    </div>
  );
}

/**
 * @param {{
 *   data?: Array<Object>,
 *   dataKey: string,
 *   color: string,
 *   label: string,
 *   unit: string,
 * }} props
 */
function SensorChart({ data = [], dataKey, color, label, unit }) {
  // Conservar solo los últimos MAX_POINTS y añadir una etiqueta de hora corta.
  const chartData = data.slice(-MAX_POINTS).map((reading) => ({
    ...reading,
    time: formatTimestamp(reading.recorded_at),
  }));

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </span>
        <span className="font-mono text-[11px] text-gray-500">{unit}</span>
      </div>

      <div className="h-44 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-600">
            Esperando datos…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 8, bottom: 0, left: -16 }}
            >
              <CartesianGrid stroke="#ffffff" strokeOpacity={0.1} vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#1f2937' }}
                minTickGap={24}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#1f2937' }}
                width={44}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={<CustomTooltip unit={unit} />}
                cursor={{ stroke: color, strokeOpacity: 0.3, strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default SensorChart;
