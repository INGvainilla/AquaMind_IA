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
│   ├── src/
│   │   ├── components/      # Componentes reutilizables de UI
│   │   ├── pages/           # Vistas / páginas de la app
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # Clientes HTTP / sockets hacia el backend
│   │   ├── layouts/         # Layouts compartidos
│   │   ├── context/         # Contextos globales (estado compartido)
│   │   ├── styles/          # Estilos globales y de Tailwind
│   │   └── utils/           # Utilidades del frontend
│   └── public/              # Recursos estáticos
├── backend/                 # API REST + WebSockets (Node.js + Express)
│   ├── src/
│   │   ├── config/          # Configuración (DB, entorno, etc.)
│   │   ├── controllers/     # Controladores de las rutas
│   │   ├── routes/          # Definición de endpoints
│   │   ├── services/        # Lógica de negocio
│   │   ├── database/        # Conexión y consultas a PostgreSQL
│   │   ├── middleware/      # Middlewares (validación, errores, etc.)
│   │   ├── sockets/         # Manejadores de Socket.IO
│   │   └── utils/           # Utilidades del backend
│   └── sql/                 # Scripts SQL (esquema de la base de datos)
├── ai/                      # Servicio de IA y simulador de sensores (Python)
│   ├── api/                 # API Flask del servicio de IA
│   ├── simulator/           # Simulador de datos de sensores
│   ├── models/              # Modelos de Machine Learning
│   ├── services/            # Lógica de análisis predictivo
│   └── utils/               # Utilidades del servicio de IA
└── docs/                    # Documentación del proyecto
```

## Cómo ejecutar

> Requisitos previos: Node.js, Python 3.10+ y PostgreSQL instalados localmente.
> Copia `.env.example` a `.env` y ajusta los valores según tu entorno.

1. **Base de datos** — crea el esquema en PostgreSQL:

```bash
psql -U postgres -d aquamind -f backend/sql/schema.sql
```

2. **Backend** (API + WebSockets):

```bash
cd backend
npm install
npm run dev
```

3. **Frontend** (aplicación web):

```bash
cd frontend
npm install
npm run dev
```

4. **IA / Simulador** (servicio de Python):

```bash
cd ai
pip install -r requirements.txt
python simulator.py
```
