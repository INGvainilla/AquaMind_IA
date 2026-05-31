# AquaMind AI — Backend

API REST + WebSockets (Node.js + Express + Socket.IO) que actúa como núcleo del
sistema: recibe las lecturas del simulador, las persiste en PostgreSQL, las envía
al servicio de IA para su análisis, genera alertas y difunde todo en tiempo real
al frontend mediante Socket.IO.

## Propósito del módulo

- Ingerir lecturas de sensores (`POST /api/sensors/data`).
- Guardar lecturas, análisis y alertas en PostgreSQL.
- Delegar el análisis predictivo al servicio de IA (Flask), con **fallback local**
  si la IA no está disponible: la ingesta nunca se detiene.
- Emitir eventos en vivo (`sensor:update`, `alert:new`) al dashboard.
- Exponer endpoints de consulta de estado, historial y alertas.

## Requisitos previos

- Node.js 18+ (probado con Node 22).
- PostgreSQL 13+ en ejecución con la base de datos creada (ver `sql/schema.sql`).

## Instalación

```bash
cd backend
npm install
```

## Configuración (variables de entorno)

El backend usa `dotenv`. Copia el archivo de ejemplo de la raíz del repo a `.env`
**dentro de `backend/`** (o en la raíz, ya que `dotenv` lee desde el cwd de arranque):

```bash
# desde la carpeta backend/
copy ..\.env.example .env      # Windows (PowerShell/cmd)
cp ../.env.example .env        # macOS / Linux
```

| Variable        | Requerida | Default                 | Descripción                                              |
|-----------------|-----------|-------------------------|----------------------------------------------------------|
| `NODE_ENV`      | No        | `development`           | Entorno. En `production` se silencian los logs de request.|
| `PORT`          | No        | `4000`                  | Puerto HTTP del backend.                                 |
| `DB_HOST`       | **Sí**    | —                       | Host de PostgreSQL.                                      |
| `DB_PORT`       | **Sí**    | `5432`                  | Puerto de PostgreSQL.                                    |
| `DB_NAME`       | **Sí**    | —                       | Nombre de la base de datos (p. ej. `aquamind`).          |
| `DB_USER`       | **Sí**    | —                       | Usuario de PostgreSQL.                                   |
| `DB_PASSWORD`   | **Sí**    | —                       | Contraseña del usuario.                                  |
| `AI_SERVICE_URL`| No        | `http://localhost:5000` | URL del servicio de IA (Flask).                          |
| `FRONTEND_URL`  | No        | `http://localhost:5173` | Origen permitido para CORS y Socket.IO.                  |

> Si falta alguna variable **requerida**, el backend aborta el arranque con un
> mensaje indicando exactamente qué configurar (ver `src/config/environment.js`).

## Conectar con la base de datos

1. Crea la base de datos y aplica el esquema:

```bash
psql -U postgres -c "CREATE DATABASE aquamind;"
psql -U postgres -d aquamind -f sql/schema.sql
```

2. Asegúrate de que las variables `DB_*` del `.env` apunten a esa base.
3. El pool de conexiones se configura en `src/config/database.js` (máx. 10
   conexiones, timeout de conexión de 5s).

## Ejecución

```bash
npm run dev      # desarrollo con recarga automática (nodemon)
npm start        # producción (node)
```

Al arrancar correctamente verás en consola:

```
🚀 AquaMind Backend corriendo en puerto 4000
```

El backend corre en **http://localhost:4000**.

## Endpoints

### `GET /health`
Chequeo simple de vida.

**Respuesta `200`:**
```json
{ "status": "ok" }
```

### `GET /api/health`
Estado del sistema, incluyendo conectividad real con PostgreSQL.

**Respuesta `200`:**
```json
{
  "status": "ok",
  "service": "AquaMind Backend",
  "uptime_seconds": 42,
  "database": "conectada",
  "ai_service_url": "http://localhost:5000",
  "frontend_url": "http://localhost:5173",
  "timestamp": "2026-05-31T05:00:00.000Z"
}
```
> `database` será `"desconectada"` si PostgreSQL no responde (el endpoint nunca falla).

### `POST /api/sensors/data`
Ingesta de una lectura del simulador. Persiste la lectura, la analiza con la IA,
evalúa alertas y emite los eventos en tiempo real.

**Body:**
```json
{
  "filter_id": "FILTRO-BOL-001",
  "turbidity": 2.5,
  "pressure": 45.0,
  "flow_rate": 50.0,
  "temperature": 20.0,
  "status": "NORMAL"
}
```
Campos requeridos: `filter_id`, `turbidity`, `pressure`, `flow_rate`, `temperature`.
`status` es opcional (default `NORMAL`).

**Respuesta `201`:**
```json
{
  "sensor": { "id": 1, "filter_id": "FILTRO-BOL-001", "turbidity": 2.5, "pressure": 45.0, "flow_rate": 50.0, "temperature": 20.0, "status": "NORMAL", "recorded_at": "2026-05-31T05:00:00.000Z" },
  "analysis": { "id": 1, "filter_id": "FILTRO-BOL-001", "health_score": 85, "risk_level": "BAJO", "estimated_life": "15-30 días", "state": "NORMAL", "recommendation": "Estado normal: ...", "anomaly_detected": false, "analyzed_at": "2026-05-31T05:00:00.000Z" },
  "alert": null
}
```

**Respuesta `400`** (faltan campos):
```json
{ "error": "Faltan campos requeridos: turbidity, pressure", "status": 400 }
```

### `GET /api/sensors/:filterId/status`
Panorama actual de un filtro: último análisis, últimas 50 lecturas y alertas activas.

**Respuesta `200`:**
```json
{
  "filter_id": "FILTRO-BOL-001",
  "analysis": { "...": "último análisis o null" },
  "latest_data": [ { "...": "lecturas (DESC)" } ],
  "active_alerts": [ { "...": "alertas no resueltas" } ]
}
```

### `GET /api/sensors/:filterId/history?hours=24`
Historial de lecturas dentro de la ventana indicada (default 24h).

**Respuesta `200`:**
```json
{ "filter_id": "FILTRO-BOL-001", "hours": 24, "count": 120, "history": [ { "...": "lecturas (ASC)" } ] }
```

### `GET /api/alerts/:filterId`
Alertas activas (no resueltas) de un filtro.

**Respuesta `200`:**
```json
{ "filter_id": "FILTRO-BOL-001", "count": 1, "alerts": [ { "id": 7, "alert_type": "ESTADO_CRITICO", "severity": "ALTA", "message": "...", "sensor_values": {}, "resolved": false, "created_at": "..." } ] }
```

### `PATCH /api/alerts/:alertId/resolve`
Marca una alerta como resuelta.

**Respuesta `200`:**
```json
{ "alert": { "id": 7, "resolved": true, "...": "..." } }
```
**Respuesta `404`:** `{ "error": "Alerta no encontrada", "status": 404 }`

## Eventos Socket.IO emitidos

| Evento          | Payload                                  | Cuándo se emite                         |
|-----------------|------------------------------------------|-----------------------------------------|
| `sensor:update` | `{ sensor, analysis }`                   | En cada `POST /api/sensors/data` exitoso.|
| `alert:new`     | objeto alerta                            | Cuando el análisis genera una alerta.   |

## Estructura de carpetas

```
backend/
├── sql/schema.sql           # Esquema de la base de datos
└── src/
    ├── server.js            # Entrada: Express + Socket.IO + arranque
    ├── config/              # environment.js (env), database.js (pool pg)
    ├── routes/              # sensorRoutes.js, alertRoutes.js
    ├── controllers/         # sensorController.js, alertController.js
    ├── services/            # aiService.js (cliente IA), alertService.js
    ├── database/            # queries.js (SQL parametrizado)
    ├── sockets/             # socketManager.js (emisión de eventos)
    └── middleware/          # requestLogger.js, errorHandler.js
```

## Problemas comunes

- **`Faltan variables de entorno requeridas: ...`** → No creaste el `.env` o le
  faltan variables `DB_*`. Copia `.env.example` y complétalo.
- **Puerto 4000 ocupado** (`EADDRINUSE`) → Otro proceso usa el puerto. Cámbialo con
  `PORT=4100` en el `.env`, o libera el puerto:
  - Windows: `netstat -ano | findstr :4000` y luego `taskkill /PID <pid> /F`.
  - macOS/Linux: `lsof -i :4000` y `kill -9 <pid>`.
- **La DB no conecta** (`ECONNREFUSED` / timeout) → Verifica que PostgreSQL esté
  corriendo, que el `DB_HOST`/`DB_PORT` sean correctos y que la base exista. Prueba
  `GET /api/health`: si `database` es `"desconectada"`, el problema está en la DB.
- **La IA no responde** → No es un error: el backend usa un **fallback** (`health_score: 75`,
  estado `NORMAL`) y sigue funcionando. Verás en consola `[aiService] IA no disponible, usando fallback`.
- **CORS bloqueado en el navegador** → Asegúrate de que `FRONTEND_URL` coincida con
  la URL real del frontend (por defecto `http://localhost:5173`).
