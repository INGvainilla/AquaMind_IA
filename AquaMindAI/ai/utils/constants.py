"""Constantes compartidas del módulo de IA de AquaMind.

Define los rangos de los sensores por estado del filtro y la configuración de
red usada por el simulador (identificador del filtro, URL del backend e intervalo).
"""

import os
from typing import Dict

# ----------------------------------------------------------------------------
# Rangos de los sensores según el estado de salud del filtro.
# El simulador usa estos rangos para generar valores realistas que correspondan
# al estado actual (NORMAL / ALERTA / CRITICO) sin saltos bruscos.
# Cada métrica es una tupla (mínimo, máximo).
# ----------------------------------------------------------------------------
SENSOR_RANGES: Dict[str, Dict[str, tuple]] = {
    # Estado óptimo: agua limpia, presión y caudal estables.
    "NORMAL": {
        "turbidity": (1.0, 3.0),      # NTU (turbidez baja)
        "pressure": (30.0, 50.0),     # PSI (presión normal)
        "flow_rate": (40.0, 60.0),    # L/min (caudal saludable)
        "temperature": (15.0, 25.0),  # °C (temperatura templada)
    },
    # Estado de advertencia: signos tempranos de saturación del filtro.
    "ALERTA": {
        "turbidity": (4.0, 6.0),
        "pressure": (60.0, 80.0),
        "flow_rate": (25.0, 40.0),
        "temperature": (25.0, 35.0),
    },
    # Estado crítico: filtro muy degradado, requiere mantenimiento inmediato.
    "CRITICO": {
        "turbidity": (6.0, 12.0),     # turbidez muy alta (>6)
        "pressure": (80.0, 110.0),    # sobrepresión (>80)
        "flow_rate": (5.0, 25.0),     # caudal bajo por obstrucción (<25)
        "temperature": (35.0, 45.0),  # sobrecalentamiento (>35)
    },
}

# ----------------------------------------------------------------------------
# Configuración de red del simulador.
# Configurable por variables de entorno para poder desplegarlo (Render worker)
# apuntando al backend en la nube. En local usa los valores por defecto.
# ----------------------------------------------------------------------------

# Identificador del filtro simulado (cooperativa de Bolivia, unidad 001).
FILTER_ID: str = os.getenv("FILTER_ID", "FILTRO-BOL-001")

# Endpoint del backend Node.js que recibe las lecturas de los sensores.
# En producción, set BACKEND_URL a la URL del backend desplegado
# (p. ej. https://aquamind-backend.onrender.com/api/sensors/data).
BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:4000/api/sensors/data")

# Segundos de espera entre cada envío de datos al backend.
SEND_INTERVAL: int = int(os.getenv("SEND_INTERVAL", "1"))
