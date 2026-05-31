// formatters.js
// Funciones de formato puras (sin efectos secundarios) para presentar fechas,
// estados y métricas con sus colores correspondientes en la UI.

/**
 * Formatea un ISO 8601 a hora local legible "HH:MM:SS".
 * @param {string} isoString - Fecha en formato ISO.
 * @returns {string} Hora formateada o '' si la entrada es inválida.
 */
export function formatTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Formatea un ISO 8601 a "DD/MM/YYYY HH:MM".
 * @param {string} isoString - Fecha en formato ISO.
 * @returns {string} Fecha y hora formateadas o '' si es inválida.
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Devuelve la clase de color de texto según el estado del filtro.
 * @param {string} status - NORMAL | ALERTA | CRITICO.
 * @returns {string} Clase de Tailwind para el color del texto.
 */
export function getStatusColor(status) {
  switch (status) {
    case 'NORMAL':
      return 'text-green-400';
    case 'ALERTA':
      return 'text-yellow-400';
    case 'CRITICO':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Devuelve las clases de un badge (texto + fondo) según el estado.
 * @param {string} status - NORMAL | ALERTA | CRITICO.
 * @returns {string} Clases de Tailwind para el badge.
 */
export function getStatusBadgeClass(status) {
  switch (status) {
    case 'NORMAL':
      return 'bg-green-500/15 text-green-400 border border-green-500/30';
    case 'ALERTA':
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
    case 'CRITICO':
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
    default:
      return 'bg-gray-500/15 text-gray-400 border border-gray-500/30';
  }
}

/**
 * Devuelve la clase de color según el nivel de riesgo.
 * @param {string} riskLevel - BAJO | MEDIO | ALTO.
 * @returns {string} Clase de Tailwind para el color del texto.
 */
export function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case 'BAJO':
      return 'text-green-400';
    case 'MEDIO':
      return 'text-yellow-400';
    case 'ALTO':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Formatea el puntaje de salud agregando una clase de color según su rango.
 * @param {number} score - Puntaje de salud (0-100).
 * @returns {{ label: string, colorClass: string }} Texto y color para la UI.
 */
export function formatHealthScore(score) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return { label: '--', colorClass: 'text-gray-400' };
  }
  let colorClass = 'text-red-400';
  if (score >= 60) colorClass = 'text-green-400';
  else if (score >= 30) colorClass = 'text-yellow-400';
  return { label: `${score}/100`, colorClass };
}
