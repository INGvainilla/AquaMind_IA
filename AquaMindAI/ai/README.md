# AquaMind AI — Módulo de IA y Simulador (Python)

Este módulo contiene dos piezas independientes:

1. **Servicio de IA** (`api/app.py`): API Flask que analiza una lectura de
   sensores y devuelve un diagnóstico del filtro (puntaje de salud, estado,
   riesgo, vida útil, recomendación y detección de anomalías).
2. **Simulador de sensores** (`simulator.py`): genera lecturas realistas de un
   filtro que se degrada con el tiempo y las envía al backend, imitando un
   dispositivo IoT instalado en campo.

## Propósito del módulo

- Proveer el "cerebro" analítico del sistema (reglas + Isolation Forest).
- Generar un flujo continuo de datos creíbles para la demo, sin hardware real.

## Requisitos previos

- Python 3.10+ (probado con Python 3.12).
- Para el simulador: el **backend** corriendo en `http://localhost:4000`.

## Instalación

```bash
cd ai
pip install -r requirements.txt
```

Dependencias principales: `flask`, `flask-cors`, `scikit-learn`, `pandas`,
`numpy`, `requests`, `python-dotenv`.

## Ejecución

> Ejecuta ambos comandos **desde la carpeta `ai/`** para que los imports de los
> paquetes (`utils`, `services`, `simulator`) resuelvan correctamente.

### Servicio de IA (Flask, puerto 5000)

```bash
python api/app.py
```

Levanta Flask en **http://localhost:5000** y expone:

- `POST /analyze` — analiza una lectura.
- `GET /health` — chequeo de vida.

### Simulador de sensores

```bash
python simulator.py
```

Al iniciar muestra el filtro y la URL de destino, y luego envía una lectura por
segundo. Verás en consola líneas como:

```
🤖 AquaMind Simulador iniciado - enviando datos cada 1s
   Filtro: FILTRO-BOL-001
   Backend destino: http://localhost:4000/api/sensors/data
[2026-05-31T05:00:00+00:00] estado=NORMAL   turbidez=2.5 ... 
✅ Enviado
```

`Ctrl+C` detiene el simulador limpiamente.

## Contrato del endpoint `/analyze`

**Request** (JSON):
```json
{ "turbidity": 8.0, "pressure": 95.0, "flow_rate": 10.0, "temperature": 40.0 }
```
Campos requeridos: `turbidity`, `pressure`, `flow_rate`, `temperature`.
(El simulador también envía `filter_id`, `status` y `timestamp`; `/analyze` los ignora.)

**Response `200`:**
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

**Response `400`** (faltan campos):
```json
{ "error": "Faltan campos requeridos: pressure, flow_rate, temperature" }
```

## Explicación del Health Score (puntaje de salud)

El health score es un número entero **0–100** calculado con reglas
determinísticas en `utils/sensor_math.py` (`calculate_health_score`). Parte de
**100** (filtro perfecto) y resta penalizaciones según cuánto se desvíe cada
métrica de su rango óptimo:

| Métrica       | Penalización por umbrales                                            |
|---------------|---------------------------------------------------------------------|
| Turbidez (NTU)| `>6` → −40 · `>3` → −20 · `>1.5` → −10                               |
| Presión (PSI) | `>80` → −30 · `>60` → −15 · `>50` → −5                               |
| Caudal (L/min)| `<25` → −30 · `<40` → −15 · `<50` → −5                               |
| Temp. (°C)    | `>35` → −15 · `>25` → −5                                             |

El resultado se acota a `[0, 100]`. A partir del puntaje se derivan:

- **Estado** (`determine_state`): `<30` → `CRITICO`, `<60` → `ALERTA`, resto → `NORMAL`.
- **Nivel de riesgo**: `CRITICO`→`ALTO`, `ALERTA`→`MEDIO`, `NORMAL`→`BAJO`.
- **Vida útil estimada** (`estimate_remaining_life`): `<30` → `12-36 horas`,
  `<60` → `3-7 días`, resto → `15-30 días`.
- **Recomendación** (`get_recommendation`): texto de mantenimiento según el estado.

> El cálculo es por **lectura individual**: el health score no es un promedio
> histórico, sino el diagnóstico del estado actual de esa muestra.

## Explicación del modelo Isolation Forest

Para la **detección de anomalías** se usa `IsolationForest` de scikit-learn
(`services/analysis_engine.py`), un modelo **no supervisado** que aísla puntos
atípicos: las anomalías requieren menos particiones para quedar aisladas y por
tanto reciben un score distinto al de las lecturas normales.

Configuración y funcionamiento:

- `contamination=0.1`: se asume que ~10% de las lecturas pueden ser anómalas.
- `random_state=42`: resultados reproducibles.
- **Historial**: cada lectura se acumula en memoria como un vector
  `[turbidity, pressure, flow_rate, temperature]`.
- **Arranque en frío**: con menos de `MIN_HISTORY = 10` lecturas, se omite la
  detección y `anomaly_detected = False` (no hay datos suficientes para entrenar).
- A partir de 10 lecturas, el modelo se **reentrena** con todo el historial
  acumulado en cada análisis y predice si la lectura actual es anómala
  (`predict == -1` → anomalía).

> El historial vive en la instancia en memoria del servicio Flask: si reinicias
> `api/app.py`, el historial se reinicia y la detección vuelve a necesitar 10
> lecturas. Es un MVP de demo, no persiste el modelo en disco.

## Estructura de carpetas

```
ai/
├── requirements.txt
├── simulator.py              # Entrada del simulador (loop de envío)
├── api/
│   └── app.py                # API Flask: /analyze y /health
├── services/
│   └── analysis_engine.py    # Motor: health score + Isolation Forest
├── simulator/
│   ├── sensor_generator.py   # Genera lecturas según el estado del filtro
│   ├── degradation.py        # Máquina de estados NORMAL→ALERTA→CRITICO
│   └── data_sender.py        # POST de la lectura al backend
└── utils/
    ├── constants.py          # Rangos por estado, FILTER_ID, BACKEND_URL, intervalo
    └── sensor_math.py        # Cálculos puros (health score, estado, etc.)
```

## Configuración del simulador

Los parámetros del simulador están en `utils/constants.py`:

- `FILTER_ID` = `"FILTRO-BOL-001"` — identificador del filtro simulado.
- `BACKEND_URL` = `"http://localhost:4000/api/sensors/data"` — destino de los envíos.
- `SEND_INTERVAL` = `1` — segundos entre lecturas.
- `SENSOR_RANGES` — rangos de cada métrica por estado (NORMAL/ALERTA/CRITICO).

## Problemas comunes

- **`ModuleNotFoundError` (utils/services/simulator)** → Ejecuta los comandos
  desde la carpeta `ai/`, no desde subcarpetas.
- **El simulador imprime `❌ Error al enviar`** → El backend no está arriba o la
  `BACKEND_URL` no coincide. Arranca el backend antes que el simulador.
- **Puerto 5000 ocupado** → Libera el puerto o cambia el `port=5000` en `api/app.py`.
- **`anomaly_detected` siempre `false`** → Es esperado durante las primeras 10
  lecturas (arranque en frío del Isolation Forest).
