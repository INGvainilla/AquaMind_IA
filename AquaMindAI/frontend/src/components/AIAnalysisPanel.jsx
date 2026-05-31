// AIAnalysisPanel.jsx
// Panel con el resultado del análisis de IA: estado, riesgo, vida útil estimada
// y recomendación. Muestra un banner rojo si se detectó una anomalía.

import { getStatusColor, getRiskColor } from '../utils/formatters';
import { STATUS_LABELS } from '../utils/constants';

/**
 * Fila de métrica con ícono, etiqueta y valor.
 */
function MetricRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-base text-gray-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <div className="mt-0.5 text-sm">{children}</div>
      </div>
    </div>
  );
}

/**
 * @param {{ analysis?: Object }} props - Objeto de análisis de IA.
 */
function AIAnalysisPanel({ analysis }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
        <span className="text-cyan-400">◈</span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Análisis de IA
        </h2>
      </div>

      {!analysis ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          Análisis no disponible todavía.
        </div>
      ) : (
        <div className="px-4 py-2">
          {analysis.anomaly_detected && (
            <div className="mb-3 mt-2 flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
              <span className="text-red-400">⛔</span>
              <span className="text-sm font-semibold text-red-400">
                Anomalía detectada
              </span>
            </div>
          )}

          <div className="divide-y divide-gray-800">
            <MetricRow icon="◉" label="Estado general">
              <span className={`font-semibold ${getStatusColor(analysis.state)}`}>
                {STATUS_LABELS[analysis.state] || analysis.state || '--'}
              </span>
            </MetricRow>

            <MetricRow icon="▲" label="Nivel de riesgo">
              <span className={`font-semibold ${getRiskColor(analysis.risk_level)}`}>
                {analysis.risk_level || '--'}
              </span>
            </MetricRow>

            <MetricRow icon="◷" label="Vida útil estimada">
              <span className="font-mono text-gray-200">
                {analysis.estimated_life || '--'}
              </span>
            </MetricRow>

            <MetricRow icon="✎" label="Recomendación">
              <span className="text-gray-300">
                {analysis.recommendation || 'Sin recomendaciones.'}
              </span>
            </MetricRow>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAnalysisPanel;
