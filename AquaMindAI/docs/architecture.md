# Arquitectura — AquaMind AI

AquaMind AI es una plataforma de monitoreo predictivo de filtros de agua. El
sistema simula sensores IoT, ingiere sus lecturas, las analiza con IA y muestra
todo en un dashboard en tiempo real.

## Flujo completo

```
 ┌──────────────────────┐
 │  Python Simulator    │   genera lecturas realistas (turbidez, presión,
 │  (ai/simulator.py)   │   caudal, temperatura) de un filtro que se degrada
 └──────────┬───────────┘
            │  POST /api/sensors/data   (cada 1s, JSON)
            ▼
 ┌──────────────────────────────────────────────┐
 │            Node.js Backend (Express)           │
 │            http://localhost:4000               │
 │                                                │
 │  1) Valida y guarda la lectura ───────────────┼──────────────┐
 │                                                │              ▼
 │                                                │      ┌───────────────┐
 │                                                │      │  PostgreSQL   │
 │  2) Pide análisis a la IA  ───────┐            │      │  (3 tablas)   │
 │                                   ▼            │      └───────────────┘
 │                          POST /analyze         │              ▲
 │                                   │            │              │
 │                                   ▼            │   3) guarda análisis y, si
 │                    ┌──────────────────────┐    │      corresponde, la alerta
 │                    │  Flask AI Service     │   │──────────────┘
 │                    │  http://localhost:5000│    │
 │                    │  reglas + IsolationF. │   │
 │                    └──────────────────────┘    │
 │                                                │
 │  4) Socket.IO emit ('sensor:update','alert:new')│
 └──────────────────────┬─────────────────────────┘
                        │  WebSocket (tiempo real)
                        ▼
 ┌──────────────────────────────┐
 │      React Frontend           │   dashboard SCADA: métricas, gráficas,
 │      http://localhost:5173    │   health score, análisis de IA y alertas
 └──────────────────────────────┘
```

Si el servicio de IA no responde, el backend aplica un **fallback** local y
continúa guardando datos y emitiendo eventos: el dashboard nunca se queda sin datos.

## Capas y responsabilidades

### 1. Simulador de sensores (Python) — `ai/simulator.py`
- **Responsabilidad:** generar un flujo continuo de lecturas creíbles, sin
  hardware real.
- Una máquina de estados (`degradation.py`) hace que el filtro recorra
  `NORMAL → ALERTA → CRITICO` y se "reemplace" para reiniciar el ciclo.
- `sensor_generator.py` produce valores dentro de los rangos del estado actual,
  con ruido gaussiano leve.
- `data_sender.py` hace `POST` al backend, tolerando errores de red sin caerse.

### 2. Servicio de IA (Python + Flask) — `ai/api/app.py`
- **Responsabilidad:** diagnosticar una lectura individual.
- `analysis_engine.py` combina **reglas determinísticas** (puntaje de salud,
  estado, vida útil, recomendación) con un **Isolation Forest** para detección de
  anomalías sobre el historial acumulado en memoria.
- Servicio sin estado persistente (el historial vive en memoria del proceso).

### 3. Backend (Node.js + Express + Socket.IO) — `backend/`
- **Responsabilidad:** orquestar el flujo y ser la única fuente de verdad.
- **Controllers** (`controllers/`): reciben la petición y delegan; sin SQL.
- **Services** (`services/`): `aiService` (cliente HTTP de la IA con fallback) y
  `alertService` (decide y crea alertas según el estado).
- **Database** (`database/queries.js`): SQL parametrizado hacia PostgreSQL.
- **Sockets** (`sockets/socketManager.js`): emite `sensor:update` y `alert:new`.
- La instancia `io` se guarda con `app.set('io', io)` y los controllers la
  recuperan con `req.app.get('io')` (sin singleton global ni acoplamiento).

### 4. Base de datos (PostgreSQL) — `backend/sql/schema.sql`
- **Responsabilidad:** persistir lecturas, análisis y alertas.
- Tres tablas: `sensor_data`, `analysis`, `alerts` (ver `docs/database.md`).

### 5. Frontend (React + Vite) — `frontend/`
- **Responsabilidad:** presentar el estado del filtro en tiempo real.
- `FilterContext` ejecuta los hooks de datos una sola vez y los comparte.
- `useSensorData` es dueño del ciclo de vida del socket; `useAlerts` y
  `useFilterStatus` complementan con REST (carga inicial y refresco de respaldo).

## Puertos y URLs por defecto

| Servicio          | Puerto | URL                       |
|-------------------|--------|---------------------------|
| Backend (REST+WS) | 4000   | http://localhost:4000     |
| Servicio de IA    | 5000   | http://localhost:5000     |
| Frontend (Vite)   | 5173   | http://localhost:5173     |
| PostgreSQL        | 5432   | localhost:5432            |

## Decisiones de diseño clave

- **Fallback de IA:** la ingesta de datos no debe depender de que la IA esté viva.
- **Tiempo real + REST de respaldo:** Socket.IO da la actualización instantánea;
  el polling REST (cada 10s) garantiza que un cliente recién abierto tenga estado.
- **Controllers delgados:** toda la lógica de negocio y SQL vive en services/queries.
- **MVP de un solo filtro:** `FILTER_ID = FILTRO-BOL-001` está fijo en simulador y
  frontend; la base de datos ya soporta múltiples filtros por `filter_id`.
