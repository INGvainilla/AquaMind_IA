# API — AquaMind AI

Documentación de todos los endpoints REST y eventos Socket.IO del sistema.

- **Backend (Node.js):** `http://localhost:4000`
- **Servicio de IA (Flask):** `http://localhost:5000`

Todas las peticiones y respuestas usan `Content-Type: application/json`.

---

## Backend REST API (`http://localhost:4000`)

### `GET /health`
Chequeo de vida simple.

**Respuesta `200`:**
```json
{ "status": "ok" }
```

---

### `GET /api/health`
Estado del sistema con verificación real de conectividad a PostgreSQL.

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
`database` toma el valor `"conectada"` o `"desconectada"`. El endpoint nunca falla
aunque la base de datos esté caída.

---

### `POST /api/sensors/data`
Ingiere una lectura de sensores. Es el endpoint que usa el simulador. Internamente:
persiste la lectura → la analiza con la IA (con fallback) → persiste el análisis →
evalúa alertas → emite eventos Socket.IO → responde.

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
| Campo        | Tipo   | Requerido | Notas                                    |
|--------------|--------|-----------|------------------------------------------|
| `filter_id`  | string | Sí        | Identificador del filtro.                |
| `turbidity`  | number | Sí        | NTU.                                     |
| `pressure`   | number | Sí        | PSI.                                     |
| `flow_rate`  | number | Sí        | L/min.                                   |
| `temperature`| number | Sí        | °C.                                      |
| `status`     | string | No        | Default `NORMAL`. Reportado por el sensor.|

**Respuesta `201`:**
```json
{
  "sensor": {
    "id": 1,
    "filter_id": "FILTRO-BOL-001",
    "turbidity": 2.5,
    "pressure": 45.0,
    "flow_rate": 50.0,
    "temperature": 20.0,
    "status": "NORMAL",
    "recorded_at": "2026-05-31T05:00:00.000Z"
  },
  "analysis": {
    "id": 1,
    "filter_id": "FILTRO-BOL-001",
    "health_score": 85,
    "risk_level": "BAJO",
    "estimated_life": "15-30 días",
    "state": "NORMAL",
    "recommendation": "Estado normal: el filtro opera correctamente...",
    "anomaly_detected": false,
    "analyzed_at": "2026-05-31T05:00:00.000Z"
  },
  "alert": null
}
```
`alert` es `null` cuando el estado es `NORMAL`; en `ALERTA`/`CRITICO` contiene el
objeto de la alerta creada.

**Respuesta `400`** (faltan campos requeridos):
```json
{ "error": "Faltan campos requeridos: turbidity, pressure", "status": 400 }
```

---

### `GET /api/sensors/:filterId/status`
Panorama actual del filtro: último análisis, últimas 50 lecturas y alertas activas.

**Ejemplo:** `GET /api/sensors/FILTRO-BOL-001/status`

**Respuesta `200`:**
```json
{
  "filter_id": "FILTRO-BOL-001",
  "analysis": {
    "id": 12, "filter_id": "FILTRO-BOL-001", "health_score": 55,
    "risk_level": "MEDIO", "estimated_life": "3-7 días", "state": "ALERTA",
    "recommendation": "Estado de alerta: programe el mantenimiento...",
    "anomaly_detected": false, "analyzed_at": "2026-05-31T05:00:00.000Z"
  },
  "latest_data": [
    { "id": 50, "filter_id": "FILTRO-BOL-001", "turbidity": 4.2, "pressure": 65.0,
      "flow_rate": 35.0, "temperature": 28.0, "status": "ALERTA",
      "recorded_at": "2026-05-31T05:00:00.000Z" }
  ],
  "active_alerts": [
    { "id": 7, "filter_id": "FILTRO-BOL-001", "alert_type": "ESTADO_ALERTA",
      "severity": "MEDIA", "message": "...", "sensor_values": { "turbidity": 4.2 },
      "resolved": false, "created_at": "2026-05-31T05:00:00.000Z" }
  ]
}
```
`analysis` puede ser `null` si todavía no hay análisis para ese filtro.

---

### `GET /api/sensors/:filterId/history`
Historial de lecturas dentro de una ventana de tiempo.

**Query params:** `hours` (opcional, default `24`).

**Ejemplo:** `GET /api/sensors/FILTRO-BOL-001/history?hours=6`

**Respuesta `200`:**
```json
{
  "filter_id": "FILTRO-BOL-001",
  "hours": 6,
  "count": 2,
  "history": [
    { "id": 1, "turbidity": 2.5, "pressure": 45.0, "flow_rate": 50.0,
      "temperature": 20.0, "status": "NORMAL", "recorded_at": "2026-05-31T04:55:00.000Z" },
    { "id": 2, "turbidity": 2.6, "pressure": 46.0, "flow_rate": 49.0,
      "temperature": 21.0, "status": "NORMAL", "recorded_at": "2026-05-31T04:56:00.000Z" }
  ]
}
```
Las lecturas vienen en orden cronológico **ascendente** (aptas para graficar).

---

### `GET /api/alerts/:filterId`
Alertas activas (no resueltas) de un filtro.

**Ejemplo:** `GET /api/alerts/FILTRO-BOL-001`

**Respuesta `200`:**
```json
{
  "filter_id": "FILTRO-BOL-001",
  "count": 1,
  "alerts": [
    { "id": 7, "filter_id": "FILTRO-BOL-001", "alert_type": "ESTADO_CRITICO",
      "severity": "ALTA", "message": "Estado crítico: reemplace el filtro...",
      "sensor_values": { "turbidity": 8.0, "pressure": 95.0, "flow_rate": 10.0, "temperature": 40.0 },
      "resolved": false, "created_at": "2026-05-31T05:00:00.000Z" }
  ]
}
```

---

### `PATCH /api/alerts/:alertId/resolve`
Marca una alerta como resuelta.

**Ejemplo:** `PATCH /api/alerts/7/resolve`

**Respuesta `200`:**
```json
{ "alert": { "id": 7, "resolved": true, "filter_id": "FILTRO-BOL-001", "...": "..." } }
```
**Respuesta `400`** (id inválido): `{ "error": "alertId inválido", "status": 400 }`
**Respuesta `404`** (no existe): `{ "error": "Alerta no encontrada", "status": 404 }`

---

## Servicio de IA REST API (`http://localhost:5000`)

### `POST /analyze`
Analiza una lectura y devuelve el diagnóstico. Lo consume el backend (`aiService`).

**Body:**
```json
{ "turbidity": 8.0, "pressure": 95.0, "flow_rate": 10.0, "temperature": 40.0 }
```
Requeridos: `turbidity`, `pressure`, `flow_rate`, `temperature`.

**Respuesta `200`:**
```json
{
  "health_score": 0,
  "risk_level": "ALTO",
  "state": "CRITICO",
  "estimated_life": "12-36 horas",
  "recommendation": "Estado crítico: reemplace el filtro de inmediato...",
  "anomaly_detected": false
}
```

**Respuesta `400`:**
```json
{ "error": "Faltan campos requeridos: pressure, flow_rate, temperature" }
```

### `GET /health`
**Respuesta `200`:** `{ "status": "ok", "service": "AquaMind AI Service" }`

---

## Eventos Socket.IO

El backend expone Socket.IO en el mismo origen que la API REST
(`http://localhost:4000`). El frontend (`useSensorData`, `useAlerts`) escucha:

| Evento          | Dirección        | Payload                              | Cuándo se emite                                   |
|-----------------|------------------|--------------------------------------|---------------------------------------------------|
| `connect`       | servidor→cliente | —                                    | Al establecerse la conexión WebSocket.            |
| `disconnect`    | servidor→cliente | `reason` (string)                    | Al cerrarse/perderse la conexión.                 |
| `sensor:update` | servidor→cliente | `{ sensor, analysis }`               | En cada `POST /api/sensors/data` exitoso.         |
| `alert:new`     | servidor→cliente | objeto alerta (igual que en REST)    | Cuando el análisis genera una alerta (ALERTA/CRITICO). |

**Payload de `sensor:update`:**
```json
{
  "sensor": { "id": 1, "filter_id": "FILTRO-BOL-001", "turbidity": 2.5,
              "pressure": 45.0, "flow_rate": 50.0, "temperature": 20.0,
              "status": "NORMAL", "recorded_at": "2026-05-31T05:00:00.000Z" },
  "analysis": { "health_score": 85, "risk_level": "BAJO", "state": "NORMAL",
                "estimated_life": "15-30 días", "recommendation": "...",
                "anomaly_detected": false }
}
```

**Payload de `alert:new`:**
```json
{
  "id": 7, "filter_id": "FILTRO-BOL-001", "alert_type": "ESTADO_CRITICO",
  "severity": "ALTA", "message": "...", "sensor_values": { "...": "..." },
  "resolved": false, "created_at": "2026-05-31T05:00:00.000Z"
}
```
