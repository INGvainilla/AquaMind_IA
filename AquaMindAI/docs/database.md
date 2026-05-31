# Base de datos — AquaMind AI

Motor: **PostgreSQL**. El esquema completo está en `backend/sql/schema.sql` y se
aplica con:

```bash
psql -U postgres -d aquamind -f backend/sql/schema.sql
```

El sistema usa tres tablas: `sensor_data`, `analysis` y `alerts`. Todas se
relacionan lógicamente por la columna `filter_id` (no hay claves foráneas
explícitas; es un MVP optimizado para ingesta rápida y consultas por filtro).

---

## Tabla `sensor_data`

Almacena cada lectura cruda enviada por los sensores del filtro. Es la fuente de
datos en tiempo real del sistema.

| Columna       | Tipo           | Restricciones        | Descripción                                              |
|---------------|----------------|----------------------|----------------------------------------------------------|
| `id`          | `SERIAL`       | PRIMARY KEY          | Identificador autoincremental de la lectura.             |
| `filter_id`   | `VARCHAR(100)` | NOT NULL             | Filtro al que pertenece la lectura.                      |
| `turbidity`   | `NUMERIC`      | —                    | Turbidez medida (NTU).                                   |
| `pressure`    | `NUMERIC`      | —                    | Presión medida (PSI).                                    |
| `flow_rate`   | `NUMERIC`      | —                    | Caudal medido (L/min).                                   |
| `temperature` | `NUMERIC`      | —                    | Temperatura medida (°C).                                 |
| `status`      | `VARCHAR(50)`  | DEFAULT `'NORMAL'`   | Estado reportado por el sensor (NORMAL/ALERTA/CRITICO).  |
| `recorded_at` | `TIMESTAMPTZ`  | DEFAULT `NOW()`      | Momento en que se registró la lectura.                   |

---

## Tabla `analysis`

Guarda el resultado del análisis de IA para cada lectura procesada.

| Columna            | Tipo           | Restricciones    | Descripción                                              |
|--------------------|----------------|------------------|----------------------------------------------------------|
| `id`               | `SERIAL`       | PRIMARY KEY      | Identificador autoincremental del análisis.              |
| `filter_id`        | `VARCHAR(100)` | NOT NULL         | Filtro analizado.                                        |
| `health_score`     | `INTEGER`      | —                | Puntaje de salud 0–100.                                  |
| `risk_level`       | `VARCHAR(50)`  | —                | Nivel de riesgo: BAJO / MEDIO / ALTO.                    |
| `estimated_life`   | `VARCHAR(100)` | —                | Vida útil estimada (texto cualitativo).                  |
| `state`            | `VARCHAR(50)`  | —                | Estado: NORMAL / ALERTA / CRITICO.                       |
| `recommendation`   | `TEXT`         | —                | Recomendación de mantenimiento.                          |
| `anomaly_detected` | `BOOLEAN`      | —                | Si el Isolation Forest detectó una anomalía.             |
| `analyzed_at`      | `TIMESTAMPTZ`  | DEFAULT `NOW()`  | Momento del análisis.                                    |

---

## Tabla `alerts`

Registra las alertas generadas cuando el estado del análisis es `ALERTA` o
`CRITICO`. Permite dar seguimiento a su resolución.

| Columna         | Tipo           | Restricciones      | Descripción                                              |
|-----------------|----------------|--------------------|----------------------------------------------------------|
| `id`            | `SERIAL`       | PRIMARY KEY        | Identificador autoincremental de la alerta.              |
| `filter_id`     | `VARCHAR(100)` | NOT NULL           | Filtro que originó la alerta.                            |
| `alert_type`    | `VARCHAR(50)`  | —                  | Tipo: `ESTADO_ALERTA` o `ESTADO_CRITICO`.                |
| `severity`      | `VARCHAR(50)`  | —                  | Severidad: MEDIA (ALERTA) o ALTA (CRITICO).              |
| `message`       | `TEXT`         | —                  | Mensaje descriptivo (usa la recomendación de la IA).     |
| `sensor_values` | `JSONB`        | —                  | Snapshot de las métricas que motivaron la alerta.        |
| `resolved`      | `BOOLEAN`      | DEFAULT `FALSE`    | `TRUE` cuando la alerta fue atendida.                    |
| `created_at`    | `TIMESTAMPTZ`  | DEFAULT `NOW()`    | Momento de creación de la alerta.                        |

`sensor_values` es `JSONB` (no `TEXT`) para permitir consultas estructuradas a
futuro; el backend lo serializa con `JSON.stringify` al insertar.

---

## Índices

| Índice                          | Tabla / columnas              | Por qué                                                                 |
|---------------------------------|-------------------------------|-------------------------------------------------------------------------|
| `idx_sensor_data_filter_id`     | `sensor_data (filter_id)`     | Casi todas las consultas filtran por filtro (`WHERE filter_id = $1`).   |
| `idx_sensor_data_recorded_at`   | `sensor_data (recorded_at)`   | Ordenar por fecha y filtrar por ventana de tiempo en el historial.      |
| `idx_analysis_filter_id`        | `analysis (filter_id)`        | Obtener el último análisis de un filtro rápidamente.                    |
| `idx_alerts_filter_resolved`    | `alerts (filter_id, resolved)`| Índice compuesto para la consulta frecuente de alertas activas por filtro.|

---

## Queries más importantes

Definidas en `backend/src/database/queries.js`:

- **Insertar lectura** (`insertSensorData`): `INSERT ... RETURNING *` en `sensor_data`.
- **Insertar análisis** (`insertAnalysis`): `INSERT ... RETURNING *` en `analysis`.
- **Insertar alerta** (`insertAlert`): `INSERT ... RETURNING *` en `alerts`
  (serializa `sensor_values` a JSON).
- **Últimas lecturas** (`getLatestSensorData`):
  ```sql
  SELECT * FROM sensor_data WHERE filter_id = $1 ORDER BY recorded_at DESC LIMIT $2;
  ```
- **Último análisis** (`getLatestAnalysis`):
  ```sql
  SELECT * FROM analysis WHERE filter_id = $1 ORDER BY analyzed_at DESC LIMIT 1;
  ```
- **Alertas activas** (`getActiveAlerts`):
  ```sql
  SELECT * FROM alerts WHERE filter_id = $1 AND resolved = FALSE ORDER BY created_at DESC;
  ```
- **Resolver alerta** (`resolveAlert`):
  ```sql
  UPDATE alerts SET resolved = TRUE WHERE id = $1 RETURNING *;
  ```
- **Historial por ventana** (`getSensorHistory`):
  ```sql
  SELECT * FROM sensor_data
  WHERE filter_id = $1 AND recorded_at >= NOW() - ($2 || ' hours')::INTERVAL
  ORDER BY recorded_at ASC;
  ```

Todas las consultas son **parametrizadas** (`$1`, `$2`, ...) para prevenir
inyección SQL.

---

## Notas

- No hay claves foráneas entre tablas: simplifica la ingesta de alto volumen y
  evita bloqueos. La integridad lógica se mantiene por `filter_id`.
- El esquema usa `CREATE TABLE IF NOT EXISTS`, por lo que re-ejecutar
  `schema.sql` es seguro (idempotente) y no borra datos existentes.
