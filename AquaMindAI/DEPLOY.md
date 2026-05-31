# Despliegue de AquaMind AI

Arquitectura del despliegue:

| Pieza | Dónde | Plan |
|-------|-------|------|
| Base de datos (PostgreSQL) | **Supabase** | ya creada |
| Backend (Node + Socket.IO) | **Render** (web service) | Free |
| Servicio de IA (Flask) | **Render** (web service) | Free |
| Frontend (React + Vite) | **Vercel** | Free |
| Simulador (Python, 1 lectura/seg) | **Local** durante la demo (recomendado) o Render worker (de pago) | — |

> Nota sobre el plan Free de Render: los servicios se "duermen" tras ~15 min sin
> tráfico de entrada y tardan ~1 min en despertar (cold start). Abre las URLs
> unos minutos antes de presentar para despertarlos.

---

## Orden de despliegue

El orden importa porque cada servicio necesita la URL del otro.

### 1) Base de datos (Supabase) — ya lista

Asegúrate de tener a mano (Supabase → Project Settings → Database):
`DB_HOST`, `DB_PORT` (5432), `DB_NAME` (postgres), `DB_USER`, `DB_PASSWORD`.

Antes de la demo, limpia las tablas para empezar de cero (SQL Editor):

```sql
TRUNCATE TABLE sensor_data, analysis, alerts RESTART IDENTITY;
```

### 2) Backend + IA (Render, vía Blueprint)

1. En Render: **New → Blueprint** y conecta tu repo de GitHub.
2. Render detecta `render.yaml` y propone crear **aquamind-backend** y **aquamind-ai**.
3. Te pedirá las variables marcadas como `sync:false`. Para **aquamind-backend**:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` → de Supabase.
   - `EMAIL_USER`, `EMAIL_PASSWORD` (App Password de Gmail), `EMAIL_FROM`, `ALERT_EMAIL`.
   - `AI_SERVICE_URL` y `FRONTEND_URL` → déjalas en blanco por ahora (las completas en los pasos 3 y 5).
4. Crea los servicios. Anota las URLs públicas, por ejemplo:
   - Backend: `https://aquamind-backend.onrender.com`
   - IA: `https://aquamind-ai.onrender.com`
5. Vuelve a **aquamind-backend → Environment** y pon:
   - `AI_SERVICE_URL = https://aquamind-ai.onrender.com`

> El servicio de IA arranca con `gunicorn api.app:app --workers 1` (1 worker para
> conservar el historial en memoria del Isolation Forest).

### 3) Frontend (Vercel)

1. En Vercel: **Add New → Project** y conecta el mismo repo de GitHub.
2. **Root Directory:** `frontend`  (importante, no la raíz del repo).
3. Framework: Vite (autodetectado). Build: `npm run build`. Output: `dist`.
4. **Environment Variables** → agrega:
   - `VITE_API_URL = https://aquamind-backend.onrender.com`
5. Deploy. Anota la URL pública, p. ej. `https://aquamind.vercel.app`.

### 4) Cerrar el círculo (CORS)

Vuelve a Render → **aquamind-backend → Environment** y pon:

- `FRONTEND_URL = https://aquamind.vercel.app`

Guarda (Render redeploya). Esto habilita CORS y Socket.IO para tu dominio de Vercel.

### 5) Simulador

Elige UNA opción:

**Opción A — Local apuntando a la nube (recomendada, gratis y simple)**

En tu PC, define la variable y corre el simulador apuntando al backend desplegado:

```powershell
# PowerShell
$env:BACKEND_URL = "https://aquamind-backend.onrender.com/api/sensors/data"
cd ai
python simulator.py
```

```bash
# macOS / Linux
export BACKEND_URL="https://aquamind-backend.onrender.com/api/sensors/data"
cd ai
python simulator.py
```

Como el simulador envía datos cada segundo, mantiene el backend despierto durante la demo.

**Opción B — Worker en Render (24/7, requiere plan de pago ~$7/mes)**

Si quieres que corra en la nube sin tu PC, añade este bloque al final de `render.yaml`
(cambia el plan a `starter` porque los workers no están en Free):

```yaml
  - type: worker
    name: aquamind-simulator
    runtime: python
    plan: starter
    rootDir: ai
    buildCommand: pip install -r requirements.txt
    startCommand: python simulator.py
    envVars:
      - key: BACKEND_URL
        value: https://aquamind-backend.onrender.com/api/sensors/data
      - key: SEND_INTERVAL
        value: "1"
```

---

## Variables de entorno (resumen)

**Backend (Render: aquamind-backend)**

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` (ya en render.yaml) |
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | de Supabase |
| `DB_PORT` | `5432` |
| `AI_SERVICE_URL` | URL pública del servicio de IA |
| `FRONTEND_URL` | URL pública del frontend en Vercel |
| `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_FROM` / `ALERT_EMAIL` | credenciales Gmail |

**Servicio de IA (Render: aquamind-ai):** ninguna obligatoria (Render inyecta `PORT`).

**Frontend (Vercel):** `VITE_API_URL` = URL pública del backend.

**Simulador:** `BACKEND_URL` (= URL del backend + `/api/sensors/data`), `SEND_INTERVAL` (opcional), `FILTER_ID` (opcional).

---

## Verificación post-deploy

1. `https://aquamind-backend.onrender.com/api/health` → `database: "conectada"`.
2. `https://aquamind-ai.onrender.com/health` → `{ "status": "ok" }`.
3. Logs del backend al arrancar: `[Email] Transporter listo ✅`.
4. Arranca el simulador (Opción A o B) y abre el frontend de Vercel: el dashboard
   debe actualizarse en tiempo real (Socket.IO).
5. Cuando el estado sea `CRITICO`/`ALERTA`, llega el email (respetando el cooldown).

## Checklist final antes de presentar

- [ ] `COOLDOWN_MINUTES = 15` en `backend/src/services/alertService.js`.
- [ ] `TRUNCATE TABLE sensor_data, analysis, alerts RESTART IDENTITY;` en Supabase.
- [ ] Despertar backend + IA (abrir sus URLs) ~2 min antes.
- [ ] Simulador corriendo y apuntando al backend desplegado.
