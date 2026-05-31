# AquaMind AI — Frontend

Dashboard web (React + Vite + Tailwind CSS) tipo SCADA para el monitoreo
predictivo de filtros de agua. Muestra métricas en tiempo real, gráficas,
puntaje de salud, el análisis de la IA y las alertas activas del filtro.

## Propósito del módulo

- Visualizar en vivo las lecturas de sensores que llegan por Socket.IO.
- Mostrar el análisis de IA (estado, riesgo, vida útil, recomendación, anomalías).
- Listar y resolver alertas activas.
- Refrescar periódicamente el estado del filtro vía REST como respaldo del stream.

## Requisitos previos

- Node.js 18+ (probado con Node 22).
- El **backend** corriendo en `http://localhost:4000` (provee REST + Socket.IO).

## Instalación

```bash
cd frontend
npm install
```

## Variables de entorno

Copia el ejemplo y ajusta si es necesario:

```bash
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux
```

| Variable       | Default                 | Descripción                                                        |
|----------------|-------------------------|--------------------------------------------------------------------|
| `VITE_API_URL` | `http://localhost:4000` | URL base del backend. Se usa tanto para las llamadas REST (axios) como para la conexión Socket.IO. |

> Las variables de Vite deben empezar con el prefijo `VITE_` para quedar expuestas
> al cliente. Si no defines `VITE_API_URL`, se usa el fallback a `localhost:4000`.

## Ejecución

```bash
npm run dev        # servidor de desarrollo (Vite) en http://localhost:5173
npm run build      # build de producción en dist/
npm run preview    # sirve el build de producción localmente
```

El dashboard queda disponible en **http://localhost:5173**.

## Estructura de carpetas

```
frontend/
├── index.html              # HTML raíz que monta la app
├── vite.config.js          # Config de Vite (React + Tailwind, puerto 5173)
└── src/
    ├── main.jsx            # Punto de entrada: monta <App /> y carga estilos
    ├── App.jsx             # Router + <FilterProvider> global
    ├── pages/
    │   └── DashboardPage.jsx   # Página principal: arma el grid del dashboard
    ├── layouts/
    │   └── DashboardLayout.jsx # Layout (fondo oscuro, contenedor centrado)
    ├── components/         # UI reutilizable:
    │   ├── FilterHeader.jsx        # Cabecera con id del filtro, estado, conexión
    │   ├── MetricCard.jsx          # Tarjeta de una métrica + tendencia
    │   ├── SensorChart.jsx         # Gráfica temporal (Recharts) de una métrica
    │   ├── HealthScoreGauge.jsx    # Indicador del puntaje de salud
    │   ├── AIAnalysisPanel.jsx     # Panel con el análisis de la IA
    │   ├── AlertPanel.jsx          # Lista de alertas + acción resolver
    │   ├── StatusBadge.jsx         # Badge NORMAL/ALERTA/CRITICO
    │   └── ConnectionStatus.jsx    # Indicador de conexión Socket.IO
    ├── context/
    │   └── FilterContext.jsx   # Estado global del filtro (1 sola suscripción)
    ├── hooks/
    │   ├── useSensorData.js    # Stream 'sensor:update' (dueño del socket)
    │   ├── useAlerts.js        # REST inicial + evento 'alert:new'
    │   └── useFilterStatus.js  # Estado del filtro vía REST (refresco c/10s)
    ├── services/
    │   ├── api.js              # Cliente axios (endpoints REST)
    │   └── socket.js           # Instancia única de Socket.IO client
    ├── utils/
    │   ├── constants.js        # FILTER_ID, etiquetas, unidades, colores
    │   └── formatters.js       # Formato de fechas, colores por estado/riesgo
    └── styles/
        └── index.css           # Estilos globales (Tailwind)
```

## Flujo de datos (resumen)

1. `FilterProvider` (en `App.jsx`) ejecuta los 3 hooks **una sola vez**.
2. `useSensorData` abre el socket y escucha `sensor:update` → actualiza la lectura
   actual y la serie para las gráficas.
3. `useAlerts` carga las alertas activas por REST y escucha `alert:new` en vivo.
4. `useFilterStatus` consulta `/api/sensors/:id/status` cada 10s como respaldo.
5. `DashboardPage` consume el contexto (`useFilter`) y pinta todos los paneles.

## Cómo agregar un nuevo sensor (métrica) al dashboard

El dashboard está parametrizado por una lista de claves de sensor. Para añadir,
por ejemplo, un sensor de **pH**:

1. **Constantes** (`src/utils/constants.js`): agrega la etiqueta, la unidad y el color.

```js
export const SENSOR_LABELS = { /* ... */ ph: 'pH' };
export const SENSOR_UNITS  = { /* ... */ ph: '' };
export const CHART_COLORS  = { /* ... */ ph: '#f472b6' };
```

2. **Lista de claves** (`src/pages/DashboardPage.jsx`): añade la clave al arreglo.

```js
const SENSOR_KEYS = ['turbidity', 'pressure', 'flow_rate', 'temperature', 'ph'];
```

Con eso aparecerán automáticamente la `MetricCard` y el `SensorChart` del nuevo
sensor (el grid los recorre con `.map`).

3. **Backend y datos**: para que el valor llegue realmente, el sensor debe venir en
   el payload del backend. Eso implica:
   - Agregar la columna `ph` en `backend/sql/schema.sql` (tabla `sensor_data`).
   - Incluir `ph` en `INSERT` de `backend/src/database/queries.js`.
   - Que el simulador (`ai/`) genere y envíe el campo `ph`.

> Si el sensor no viene en los datos, la tarjeta/gráfica se mostrará con `--`
> (la UI tolera valores ausentes), pero no romperá el dashboard.

## Problemas comunes

- **El dashboard no muestra datos** → Verifica que el backend esté arriba
  (`http://localhost:4000`) y que el simulador esté enviando lecturas. Revisa el
  indicador de conexión en la cabecera; si está rojo, el socket no conectó.
- **Banner "Sin conexión en tiempo real"** → El socket no pudo abrirse. Comprueba
  `VITE_API_URL` y que `FRONTEND_URL` en el backend coincida con la URL del frontend.
- **Puerto 5173 ocupado** → Vite intentará otro puerto; o cámbialo en `vite.config.js`.
