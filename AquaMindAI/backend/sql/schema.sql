-- ============================================================================
-- AquaMind AI - Esquema de base de datos (PostgreSQL)
-- ----------------------------------------------------------------------------
-- Este script crea las tablas e índices necesarios para el monitoreo
-- predictivo de filtros de agua. Puede ejecutarse directamente con:
--   psql -U postgres -d aquamind -f schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: sensor_data
-- Propósito: Almacena cada lectura cruda enviada por los sensores instalados
-- en los filtros de agua (turbidez, presión, caudal y temperatura). Es la
-- fuente de datos en tiempo real sobre la que se basa el análisis predictivo.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_data (
    id          SERIAL PRIMARY KEY,
    filter_id   VARCHAR(100) NOT NULL,
    turbidity   NUMERIC,
    pressure    NUMERIC,
    flow_rate   NUMERIC,
    temperature NUMERIC,
    status      VARCHAR(50) DEFAULT 'NORMAL',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Tabla: analysis
-- Propósito: Guarda el resultado del análisis de IA para cada filtro: puntaje
-- de salud, nivel de riesgo, vida útil estimada, estado y recomendación de
-- mantenimiento, indicando además si se detectó alguna anomalía.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis (
    id               SERIAL PRIMARY KEY,
    filter_id        VARCHAR(100) NOT NULL,
    health_score     INTEGER,
    risk_level       VARCHAR(50),
    estimated_life   VARCHAR(100),
    state            VARCHAR(50),
    recommendation   TEXT,
    anomaly_detected BOOLEAN,
    analyzed_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Tabla: alerts
-- Propósito: Registra las alertas generadas (por umbrales o por la IA) para
-- cada filtro, con su tipo, severidad, mensaje y los valores de sensor que la
-- originaron. El campo "resolved" permite dar seguimiento a su atención.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id            SERIAL PRIMARY KEY,
    filter_id     VARCHAR(100) NOT NULL,
    alert_type    VARCHAR(50),
    severity      VARCHAR(50),
    message       TEXT,
    sensor_values JSONB,
    resolved      BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Índices
-- Propósito: Optimizar las consultas más frecuentes (por filtro, por fecha y
-- por alertas pendientes de resolver).
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sensor_data_filter_id   ON sensor_data (filter_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_recorded_at ON sensor_data (recorded_at);
CREATE INDEX IF NOT EXISTS idx_analysis_filter_id      ON analysis (filter_id);
CREATE INDEX IF NOT EXISTS idx_alerts_filter_resolved  ON alerts (filter_id, resolved);
