# Flujos del sistema — AquaMind AI

Este documento describe, paso a paso, los tres flujos centrales del sistema.

---

## 1. Flujo de un dato: del sensor al dashboard

1. **Generación** — `ai/simulator.py` corre en bucle. En cada ciclo,
   `SensorGenerator.generate_reading()` consulta el estado del filtro a la máquina
   de degradación (`degradation.py`) y produce una lectura con `turbidity`,
   `pressure`, `flow_rate`, `temperature`, `status`, `filter_id` y `timestamp`.
2. **Envío** — `data_sender.send_to_backend()` hace
   `POST http://localhost:4000/api/sensors/data` con la lectura en JSON
   (timeout 5s). Imprime `✅ Enviado` si el backend responde 2xx.
3. **Recepción y validación** — `sensorController.receiveSensorData` valida que
   estén `filter_id`, `turbidity`, `pressure`, `flow_rate`, `temperature`. Si falta
   alguno, responde `400` y no continúa.
4. **Persistencia de la lectura** — `queries.insertSensorData()` guarda la fila en
   `sensor_data` y devuelve el registro con `id` y `recorded_at`.
5. **Análisis de IA** — `aiService.analyzeData()` hace
   `POST http://localhost:5000/analyze`. Si la IA no responde (timeout/caída),
   devuelve un **fallback** (`health_score: 75`, estado `NORMAL`) sin romper el flujo.
6. **Persistencia del análisis** — `queries.insertAnalysis()` guarda el resultado
   en `analysis`.
7. **Evaluación de alertas** — `alertService.checkAndCreateAlerts()` revisa el
   `state`; crea alerta solo si es `ALERTA` o `CRITICO` (ver flujo 2).
8. **Emisión en tiempo real** — el controller recupera `io` con
   `req.app.get('io')` y emite `sensor:update` con `{ sensor, analysis }`. Si hubo
   alerta, también emite `alert:new`.
9. **Respuesta HTTP** — el backend responde `201` con `{ sensor, analysis, alert }`
   al simulador.
10. **Recepción en el frontend** — `useSensorData` escucha `sensor:update`,
    normaliza el payload y actualiza `latestReading` y la serie `sensorReadings`
    (máx. 50 lecturas).
11. **Render** — `DashboardPage` (vía `useFilter`) repinta las `MetricCard`, las
    `SensorChart`, el `HealthScoreGauge` y el `AIAnalysisPanel` **sin recargar la
    página**.

> Respaldo: aunque no llegara el evento, `useFilterStatus` consulta
> `GET /api/sensors/:id/status` cada 10s, de modo que el dashboard converge al
> estado correcto de todas formas.

---

## 2. Flujo de creación de una alerta

1. Ocurren los pasos 1–6 del flujo anterior: se guardó la lectura y su análisis.
2. **Decisión** — `alertService.checkAndCreateAlerts(sensorData, analysis, filterId)`
   lee `analysis.state` y lo busca en el mapa:
   - `CRITICO` → `{ severity: 'ALTA', alert_type: 'ESTADO_CRITICO' }`
   - `ALERTA`  → `{ severity: 'MEDIA', alert_type: 'ESTADO_ALERTA' }`
   - `NORMAL` (u otro) → **no se crea alerta**, devuelve `null`.
3. **Construcción** — si corresponde, arma la alerta con el `message` (la
   recomendación de la IA) y `sensor_values` (snapshot de turbidez, presión,
   caudal y temperatura que la motivaron).
4. **Persistencia** — `queries.insertAlert()` la inserta en `alerts` con
   `resolved = FALSE` y devuelve la fila creada.
5. **Emisión** — de vuelta en el controller, se emite `alert:new` con la alerta.
6. **Recepción en el frontend** — `useAlerts` escucha `alert:new` y antepone la
   alerta a la lista (`hasUnread = true`).
7. **Render** — `AlertPanel` muestra la nueva alerta automáticamente.
8. **Resolución (acción del usuario)** — al pulsar resolver, `useAlerts.resolveAlert`
   llama `PATCH /api/alerts/:id/resolve`; el backend marca `resolved = TRUE` y el
   frontend quita la alerta de la lista local.

---

## 3. Flujo de análisis de IA

Ocurre dentro del servicio Flask (`ai/api/app.py` → `AnalysisEngine.analyze`):

1. **Entrada** — el backend envía `POST /analyze` con `turbidity`, `pressure`,
   `flow_rate`, `temperature`. Flask valida que estén presentes (si no, `400`).
2. **Acumulación** — `add_reading()` agrega la lectura al historial en memoria
   como vector `[turbidity, pressure, flow_rate, temperature]`.
3. **Puntaje de salud** — `calculate_health_score()` parte de 100 y resta
   penalizaciones por cada métrica fuera de rango; acota a `[0, 100]`.
4. **Métricas derivadas:**
   - `determine_state()` → `CRITICO` (<30), `ALERTA` (<60) o `NORMAL`.
   - `risk_level` por mapeo del estado (`ALTO`/`MEDIO`/`BAJO`).
   - `estimate_remaining_life()` → texto cualitativo de vida útil.
   - `get_recommendation()` → recomendación de mantenimiento.
5. **Detección de anomalías:**
   - Si el historial tiene **menos de 10** lecturas → `anomaly_detected = False`
     (arranque en frío, no hay datos para entrenar).
   - Si tiene 10 o más → se reentrena el `IsolationForest` con todo el historial y
     se predice la lectura actual (`-1` = anomalía → `True`).
6. **Salida** — devuelve `health_score`, `risk_level`, `state`, `estimated_life`,
   `recommendation`, `anomaly_detected`.
7. **Uso en el backend** — `aiService` añade `filter_id` al resultado y lo retorna
   al controller, que lo persiste y lo difunde (flujos 1 y 2).

> Si este servicio está caído, el backend no se entera más allá de un timeout:
> aplica el **fallback** y el sistema sigue operando con un análisis neutro.
