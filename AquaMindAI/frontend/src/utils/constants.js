// constants.js
// Constantes compartidas del frontend: identificador del filtro, etiquetas,
// unidades y colores usados para mostrar y graficar los datos de sensores.

// Filtro monitoreado por defecto en este MVP (una sola unidad).
export const FILTER_ID = 'FILTRO-BOL-001';

// Etiquetas legibles (en español) para cada métrica de sensor.
export const SENSOR_LABELS = {
  turbidity: 'Turbidez',
  pressure: 'Presión',
  flow_rate: 'Caudal',
  temperature: 'Temperatura',
};

// Unidades de medida de cada métrica.
export const SENSOR_UNITS = {
  turbidity: 'NTU',
  pressure: 'PSI',
  flow_rate: 'L/min',
  temperature: '°C',
};

// Etiquetas legibles para los estados del filtro.
export const STATUS_LABELS = {
  NORMAL: 'Normal',
  ALERTA: 'Alerta',
  CRITICO: 'Crítico',
};

// Colores por métrica para las series de las gráficas (Recharts).
export const CHART_COLORS = {
  turbidity: '#60a5fa',
  pressure: '#f97316',
  flow_rate: '#34d399',
  temperature: '#a78bfa',
};
