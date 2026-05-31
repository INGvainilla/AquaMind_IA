"""Motor de análisis predictivo de filtros de AquaMind.

Combina reglas determinísticas (puntaje de salud) con un modelo Isolation Forest
para detección de anomalías, produciendo un diagnóstico completo por lectura.
"""

from typing import Dict, List

import numpy as np
from sklearn.ensemble import IsolationForest

from utils.sensor_math import (
    calculate_health_score,
    determine_state,
    estimate_remaining_life,
    get_recommendation,
)

# Cantidad mínima de lecturas antes de habilitar la detección de anomalías.
MIN_HISTORY = 10

# Mapeo de estado del filtro a nivel de riesgo de negocio.
STATE_TO_RISK = {"CRITICO": "ALTO", "ALERTA": "MEDIO", "NORMAL": "BAJO"}


class AnalysisEngine:
    """Analiza lecturas de sensores y diagnostica el estado del filtro."""

    def __init__(self) -> None:
        # Isolation Forest: modelo no supervisado para detectar lecturas atípicas.
        # contamination=0.1 asume ~10% de anomalías; random_state fija resultados.
        self.model = IsolationForest(contamination=0.1, random_state=42)
        # Historial de lecturas [turbidity, pressure, flow_rate, temperature].
        self.history: List[List[float]] = []

    def add_reading(
        self,
        turbidity: float,
        pressure: float,
        flow_rate: float,
        temperature: float,
    ) -> None:
        """Agrega una lectura al historial usado para entrenar el modelo."""
        self.history.append([turbidity, pressure, flow_rate, temperature])

    def analyze(self, reading: Dict) -> Dict:
        """Diagnostica una lectura y devuelve el análisis completo.

        Flujo:
        1) Calcular el puntaje de salud con reglas determinísticas.
        2) Derivar estado, vida útil restante y recomendación.
        3) Detectar anomalías con Isolation Forest si hay suficiente historial;
           con menos de MIN_HISTORY lecturas, se omite (anomaly_detected=False).
        """
        turbidity = reading["turbidity"]
        pressure = reading["pressure"]
        flow_rate = reading["flow_rate"]
        temperature = reading["temperature"]

        # 1) Puntaje de salud y métricas derivadas (siempre disponibles).
        health_score = calculate_health_score(turbidity, pressure, flow_rate, temperature)
        state = determine_state(health_score)
        estimated_life = estimate_remaining_life(health_score)
        recommendation = get_recommendation(state)
        risk_level = STATE_TO_RISK[state]

        # 3) Detección de anomalías: requiere un historial mínimo para entrenar.
        anomaly_detected = False
        if len(self.history) >= MIN_HISTORY:
            # Reentrenamos con todo el historial acumulado en cada análisis.
            data = np.array(self.history)
            self.model.fit(data)
            # predict devuelve -1 para anomalía y 1 para lectura normal.
            current = np.array([[turbidity, pressure, flow_rate, temperature]])
            prediction = self.model.predict(current)
            anomaly_detected = bool(prediction[0] == -1)

        return {
            "health_score": health_score,
            "risk_level": risk_level,
            "state": state,
            "estimated_life": estimated_life,
            "recommendation": recommendation,
            "anomaly_detected": anomaly_detected,
        }
