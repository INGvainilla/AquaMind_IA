# 💧 AquaMind AI

**Plataforma de monitoreo predictivo inteligente para filtros de agua**

> Hackathon 2026 · Santa Cruz de la Sierra, Bolivia

---

## ¿Qué es AquaMind AI?

AquaMind AI es un sistema de monitoreo en tiempo real que usa sensores IoT y modelos de Machine Learning para predecir fallas en filtros de agua **antes de que ocurran**. Está orientado a las 9 cooperativas de agua de Santa Cruz de la Sierra, donde el mantenimiento reactivo genera costos hasta 5 veces mayores que el predictivo.

El sistema monitorea continuamente turbidez, presión, caudal y temperatura, analiza anomalías con IA y genera alertas automáticas con estimación de vida útil del filtro.

---

## El problema

Las cooperativas de agua en Bolivia no cuentan con herramientas que les digan el estado real de sus filtros. El mantenimiento se hace por calendario fijo o cuando algo ya falló. Consecuencias:

- Reparaciones de emergencia que cuestan 4–5× más (McKinsey)
- Riesgo de contaminación por turbidez elevada
- Cambio de filtros antes de agotar su vida útil real
- Sin visibilidad del estado del sistema en tiempo real

---

## Solución

Un dashboard industrial que recibe datos de sensores cada segundo, los analiza con Isolation Forest, calcula un **health score** del filtro (0–100) y emite alertas automáticas cuando detecta degradación progresiva. Todo actualizado en tiempo real sin recargar la página.

| Métrica | Valor |
|---|---|
| Cooperativas en Santa Cruz | 9 activas |
| Reducción de costos posible | 25–40% |
| Precisión del modelo IA | 92–95% |
| Costo MVP hardware | $77 USD por unidad |
| Mercado mantenimiento predictivo 2030 | $28.2B USD |

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TailwindCSS + Recharts |
| Backend | Node.js + Express + Socket.IO |
| Base de datos | PostgreSQL |
| IA / ML | Python + Flask + scikit-learn (Isolation Forest) |
| Tiempo real | WebSockets (Socket.IO) |
| Sensores (MVP) | Simulador Python con degradación progresiva |
| Sensores (producción) | ESP32 + sensores físicos ($77 USD/unidad) |

---

## Arquitectura

```
Simulador Python ──► POST /api/sensors/data ──► Node.js Backend ──► PostgreSQL
                                                        │
                                              POST /analyze ──► Flask IA Service
                                                        │
                                              Socket.IO emit ──► React Dashboard
```

```
AquaMindAI/
├── frontend/        # Dashboard React en tiempo real
├── backend/         # API REST + Socket.IO (Node.js)
├── ai/              # Simulador de sensores + servicio IA (Python)
├── docs/            # Documentación técnica
└── README.md
```

---

## Cómo ejecutar el proyecto

### Requisitos previos
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+ corriendo localmente

### 1. Base de datos
```bash
psql -U postgres -c "CREATE DATABASE aquamind;"
psql -U postgres -d aquamind -f backend/sql/schema.sql
```

### 2. Variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

### 3. Backend (Node.js)
```bash
cd backend
npm install
npm run dev
# Corre en http://localhost:4000
```

### 4. Servicio IA (Flask)
```bash
cd ai
pip install -r requirements.txt
python api/app.py
# Corre en http://localhost:5000
```

### 5. Simulador de sensores
```bash
cd ai
python simulator.py
# Genera y envía datos cada 1 segundo
```

### 6. Frontend (React)
```bash
cd frontend
npm install
npm run dev
# Dashboard en http://localhost:5173
```

---

## Cómo funciona la IA

El sistema usa **Isolation Forest** de scikit-learn para detección de anomalías en tiempo real. Además calcula un **health score** (0–100) basado en penalizaciones por cada sensor fuera de rango:

- Turbidez alta → penalización progresiva hasta −40 pts
- Presión alta → penalización hasta −30 pts  
- Caudal bajo → penalización hasta −30 pts
- Temperatura alta → penalización hasta −15 pts

Con el health score determina el estado del filtro (`NORMAL` / `ALERTA` / `CRÍTICO`), el nivel de riesgo, la vida útil estimada y la recomendación de mantenimiento.

---

## Simulación de estados

El simulador replica degradación progresiva realista:

| Estado | Turbidez (NTU) | Presión (PSI) | Caudal (L/min) |
|---|---|---|---|
| NORMAL | 1 – 3 | 30 – 50 | 40 – 60 |
| ALERTA | 4 – 6 | 60 – 80 | 25 – 40 |
| CRÍTICO | > 6 | > 80 | < 25 |

---

## Impacto social

- **ODS 6** — Agua limpia y saneamiento
- **ODS 3** — Salud y bienestar (turbidez alta = riesgo de patógenos)
- **ODS 11** — Ciudades sostenibles
- Beneficio directo para +182,000 conexiones solo en SAGUAPAC

---

## Roadmap post-hackathon

- [ ] Integración con hardware ESP32 real ($77 USD/unidad)
- [ ] Protocolo MQTT para comunicación IoT
- [ ] Modelo LSTM para predicción de series temporales largas
- [ ] Reportes automáticos con Gemini API
- [ ] App móvil para operadores de campo

---

## Equipo

Desarrollado en la Hackathon 2026 · Santa Cruz de la Sierra, Bolivia 🇧🇴
Franco Saavedra Leonardo 
Mujica Vallejos Andy Mauricio 
Condori Diaz Marilyn Esther
Delgado Rojas Alberto Caleb 


---

*AquaMind AI — Donde la ciencia de datos se encuentra con la necesidad más fundamental de Santa Cruz y Bolivia.*
