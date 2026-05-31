// DashboardPage.jsx
// Página principal del dashboard. Consume el contexto del filtro (useFilter) y
// distribuye los datos en un grid SCADA: cabecera, métricas, gráficas, salud +
// análisis de IA y panel de alertas. Muestra skeletons mientras no hay datos.

import { useMemo } from 'react';
import { useFilter } from '../context/FilterContext';
import DashboardLayout from '../layouts/DashboardLayout';
import FilterHeader from '../components/FilterHeader';
import MetricCard from '../components/MetricCard';
import SensorChart from '../components/SensorChart';
import HealthScoreGauge from '../components/HealthScoreGauge';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import AlertPanel from '../components/AlertPanel';
import { SENSOR_LABELS, SENSOR_UNITS, CHART_COLORS } from '../utils/constants';

// Claves de sensores en el orden de presentación.
const SENSOR_KEYS = ['turbidity', 'pressure', 'flow_rate', 'temperature'];

/**
 * Calcula la tendencia de una métrica comparando las dos últimas lecturas.
 * @param {Array<Object>} readings - Lecturas en orden cronológico ascendente.
 * @param {string} key - Clave del sensor.
 * @returns {'subiendo'|'bajando'|'estable'}
 */
function computeTrend(readings, key) {
  if (!readings || readings.length < 2) return 'estable';
  const last = Number(readings[readings.length - 1]?.[key]);
  const prev = Number(readings[readings.length - 2]?.[key]);
  if (Number.isNaN(last) || Number.isNaN(prev)) return 'estable';
  const delta = last - prev;
  // Umbral relativo pequeño para evitar parpadeo por ruido.
  if (Math.abs(delta) < Math.abs(prev) * 0.005) return 'estable';
  return delta > 0 ? 'subiendo' : 'bajando';
}

/** Placeholder animado para estados de carga. */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-gray-900 ${className}`} />;
}

function DashboardPage() {
  const {
    filterId,
    sensorReadings,
    latestReading,
    isConnected,
    alerts,
    resolveAlert,
    filterStatus,
    statusLoading,
  } = useFilter();

  // Serie cronológica (ascendente) para las gráficas: prioriza el stream en vivo;
  // si aún no llega nada, usa las últimas lecturas del REST (vienen en DESC).
  const chartData = useMemo(() => {
    if (sensorReadings && sensorReadings.length > 0) return sensorReadings;
    const restData = filterStatus?.latest_data || [];
    return [...restData].reverse();
  }, [sensorReadings, filterStatus]);

  // Lectura actual: última del stream o la más reciente del REST.
  const currentReading =
    latestReading || filterStatus?.latest_data?.[0] || null;

  // Análisis vigente: el adjunto al stream o el último del REST.
  const analysis = latestReading?.analysis || filterStatus?.analysis || null;

  // Estado global del filtro para cabecera/borde de tarjetas.
  const filterState = analysis?.state || currentReading?.status || 'NORMAL';

  // ¿Tenemos algún dato para pintar? Si no, mostramos skeletons.
  const hasData = Boolean(currentReading) || chartData.length > 0;
  const isLoading = statusLoading && !hasData;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SENSOR_KEYS.map((k) => (
              <Skeleton key={k} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
              {SENSOR_KEYS.map((k) => (
                <Skeleton key={k} className="h-56" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Banner de error de conexión */}
        {!isConnected && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5">
            <span className="text-red-400">⛔</span>
            <span className="text-sm text-red-300">
              Sin conexión en tiempo real con el servidor. Reintentando…
            </span>
          </div>
        )}

        {/* Fila superior: cabecera a ancho completo */}
        <FilterHeader
          filterId={filterId}
          status={filterState}
          isConnected={isConnected}
          lastUpdate={currentReading?.recorded_at}
        />

        {/* Segunda fila: 4 tarjetas de métricas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SENSOR_KEYS.map((key) => (
            <MetricCard
              key={key}
              label={SENSOR_LABELS[key]}
              value={currentReading?.[key]}
              unit={SENSOR_UNITS[key]}
              trend={computeTrend(chartData, key)}
              status={filterState}
            />
          ))}
        </div>

        {/* Tercera fila: gráficas (2/3) + salud y análisis (1/3) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            {SENSOR_KEYS.map((key) => (
              <SensorChart
                key={key}
                data={chartData}
                dataKey={key}
                color={CHART_COLORS[key]}
                label={SENSOR_LABELS[key]}
                unit={SENSOR_UNITS[key]}
              />
            ))}
          </div>

          <div className="space-y-4">
            <HealthScoreGauge score={analysis?.health_score} state={filterState} />
            <AIAnalysisPanel analysis={analysis} />
          </div>
        </div>

        {/* Fila inferior: panel de alertas a ancho completo */}
        <AlertPanel alerts={alerts} onResolve={resolveAlert} />
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;
