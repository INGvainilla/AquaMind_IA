# AquaMind AI

Plataforma IoT de monitoreo predictivo de filtros de agua para cooperativas en Bolivia.
Captura datos de sensores en tiempo real (turbidez, presión, caudal, temperatura) y los
analiza con modelos de IA para anticipar fallas y emitir alertas tempranas de mantenimiento.

## Stack

- **Frontend:** React + Vite, React Router, Axios, Socket.IO Client, Recharts, Tailwind CSS
- **Backend:** Node.js + Express, Socket.IO, PostgreSQL (`pg`), CORS, dotenv, express-validator
- **IA / Simulador:** Python + Flask, scikit-learn, pandas, numpy
- **Base de datos:** PostgreSQL

## Arquitectura de carpetas

```
AquaMindAI/
├── frontend/                # Aplicación web (React + Vite)
│   ├── index.html           # HTML raíz que monta la app
│   └── src/
│       ├── components/      # Componentes reutilizables de UI
│       ├── pages/           # Vistas / páginas de la app
│       ├── hooks/           # Custom React hooks
│       ├── services/        # Clientes HTTP / sockets hacia el backend
│       ├── layouts/         # Layouts compartidos
│       ├── context/         # Contextos globales (estado compartido)
│       ├── styles/          # Estilos globales y de Tailwind
│       └── utils/           # Utilidades del frontend
├── backend/                 # API REST + WebSockets (Node.js + Express)
│   ├── src/
│   │   ├── config/          # Configuración (DB, entorno)
│   │   ├── controllers/     # Controladores de las rutas
│   │   ├── routes/          # Definición de endpoints
│   │   ├── services/        # Lógica de negocio (IA, alertas)
│   │   ├── database/        # Conexión y consultas a PostgreSQL
│   │   ├── middleware/      # Middlewares (logging, errores)
│   │   └── sockets/         # Manejadores de Socket.IO
│   └── sql/                 # Scripts SQL (esquema de la base de datos)
├── ai/                      # Servicio de IA y simulador de sensores (Python)
│   ├── api/                 # API Flask del servicio de IA
│   ├── simulator/           # Simulador de datos de sensores
│   ├── services/            # Lógica de análisis predictivo (Isolation Forest)
│   ├── utils/               # Constantes y cálculos del servicio de IA
│   └── simulator.py         # Punto de entrada del simulador
└── docs/                    # Documentación del proyecto
```

## Puertos de cada servicio

| Servicio              | Puerto | URL                     | Comando                     |
|-----------------------|--------|-------------------------|-----------------------------|
| PostgreSQL            | 5432   | localhost:5432          | (servicio del sistema)      |
| Backend (REST + WS)   | 4000   | http://localhost:4000   | `npm run dev` en `backend/` |
| Servicio de IA (Flask)| 5000   | http://localhost:5000   | `python api/app.py` en `ai/`|
| Frontend (Vite)       | 5173   | http://localhost:5173   | `npm run dev` en `frontend/`|

## Cómo ejecutar (en orden)

> Requisitos previos: Node.js 18+, Python 3.10+ y PostgreSQL instalados localmente.
> Copia `.env.example` a `.env` (backend) y `frontend/.env.example` a `frontend/.env`.
>
> En **Windows/PowerShell** ejecuta cada servicio en su **propia terminal** (no
> uses `&&`; PowerShell no lo soporta). Abre 4 terminales, una por servicio.

### 1) Base de datos (primero)

Crea la base y aplica el esquema:

```bash
psql -U postgres -c "CREATE DATABASE aquamind;"
psql -U postgres -d aquamind -f backend/sql/schema.sql
```

### 2) Backend (segundo)

```bash
cd backend
npm install
copy ..\.env.example .env   # Windows  (o: cp ../.env.example .env)
# edita .env y pon tu DB_PASSWORD
npm run dev
```

Debe mostrar: `🚀 AquaMind Backend corriendo en puerto 4000`.
Verifica el sistema en http://localhost:4000/api/health.

### 3) Servicio de IA (tercero)

```bash
cd ai
pip install -r requirements.txt
python api/app.py            # Flask en el puerto 5000
```

> El backend funciona aunque la IA no esté arriba (usa un fallback), pero para
> obtener análisis reales arranca este servicio.

### 4) Simulador de sensores (cuarto)

En otra terminal, con el backend ya corriendo:

```bash
cd ai
python simulator.py          # envía una lectura por segundo
```

### 5) Frontend (quinto)

```bash
cd frontend
npm install
npm run dev                  # Vite en el puerto 5173
```

Abre **http://localhost:5173** y verás el dashboard actualizándose en tiempo real.

## Documentación

- [`docs/architecture.md`](docs/architecture.md) — arquitectura y flujo completo.
- [`docs/api.md`](docs/api.md) — endpoints REST y eventos Socket.IO.
- [`docs/database.md`](docs/database.md) — esquema de las tablas e índices.
- [`docs/flow.md`](docs/flow.md) — flujos paso a paso (dato, alerta, IA).
- READMEs por módulo: [`backend/`](backend/README.md), [`frontend/`](frontend/README.md), [`ai/`](ai/README.md).
