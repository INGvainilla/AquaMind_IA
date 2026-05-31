"""Generador de lecturas de sensores para el simulador de AquaMind.

Combina el estado de degradación del filtro con valores aleatorios dentro de los
rangos correspondientes para producir lecturas realistas en formato dict.
"""

import random
from datetime import datetime, timezone
from typing import Dict

from utils.constants import SENSOR_RANGES
from simulator.degradation import FilterDegradation


class SensorGenerator:
    """Produce lecturas de sensores acordes al estado actual del filtro."""

    def __init__(self) -> None:
        # El generador delega en el modelo de degradación para saber qué estado
        # (y por tanto qué rangos) usar en cada lectura.
        self.degradation = FilterDegradation()

    def _value(self, low: float, high: float) -> float:
        """Toma un valor uniforme del rango y le suma ruido gaussiano leve.

        El ruido gaussiano imita la imprecisión natural de un sensor físico.
        """
        base = random.uniform(low, high)
        # Desviación estándar pequeña relativa al ancho del rango.
        noise = random.gauss(0, (high - low) * 0.03)
        # Evitamos valores negativos sin sentido físico.
        return round(max(0.0, base + noise), 2)

    def generate_reading(self, filter_id: str) -> Dict:
        """Genera una lectura completa de sensores para el filtro indicado."""
        # Avanzar la degradación y obtener el estado vigente.
        state = self.degradation.next_state()
        ranges = SENSOR_RANGES[state]

        return {
            "filter_id": filter_id,
            "turbidity": self._value(*ranges["turbidity"]),
            "pressure": self._value(*ranges["pressure"]),
            "flow_rate": self._value(*ranges["flow_rate"]),
            "temperature": self._value(*ranges["temperature"]),
            "status": state,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
