// AlertPanel.jsx
// Lista de alertas activas con severidad, mensaje, hora y acción de resolver.
// Las alertas nuevas entran con animación slide-in; el panel hace scroll interno.

import { formatTimestamp } from '../utils/formatters';

// Estilo por severidad (BAJA / MEDIA / ALTA). Ícono Unicode, sin librerías.
const SEVERITY = {
  ALTA: { icon: '⛔', color: 'text-red-400', dot: 'bg-red-500', border: 'border-l-red-500' },
  MEDIA: { icon: '⚠', color: 'text-yellow-400', dot: 'bg-yellow-500', border: 'border-l-yellow-500' },
  BAJA: { icon: 'ℹ', color: 'text-cyan-400', dot: 'bg-cyan-500', border: 'border-l-cyan-500' },
};

/**
 * @param {{ alerts?: Array<Object>, onResolve?: Function }} props
 */
function AlertPanel({ alerts = [], onResolve }) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Alertas activas
        </h2>
        <span className="font-mono text-xs text-gray-500">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <span className="text-2xl text-green-400">✓</span>
          <p className="text-sm text-gray-400">Sin alertas activas</p>
        </div>
      ) : (
        <ul className="scrollbar-thin max-h-72 divide-y divide-gray-800 overflow-y-auto">
          {alerts.map((alert) => {
            const sev = SEVERITY[alert.severity] || SEVERITY.BAJA;
            return (
              <li
                key={alert.id}
                className={`animate-slide-in flex items-start gap-3 border-l-4 ${sev.border} px-4 py-3`}
              >
                <span className={`mt-0.5 text-base ${sev.color}`}>{sev.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-200">{alert.message}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-[11px] font-semibold uppercase ${sev.color}`}>
                      {alert.severity || 'BAJA'}
                    </span>
                    <span className="font-mono text-[11px] text-gray-500">
                      {formatTimestamp(alert.created_at)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onResolve?.(alert.id)}
                  className="shrink-0 rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300 transition-colors duration-200 hover:border-cyan-500/50 hover:text-cyan-400"
                >
                  Resolver
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default AlertPanel;
