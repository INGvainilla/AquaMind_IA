"""Modelo de degradación progresiva de un filtro de agua.

Simula cómo un filtro pasa gradualmente de NORMAL a ALERTA y a CRITICO con el
paso de los ciclos, para que el flujo de datos se vea realista y no aleatorio.
"""

import random


class FilterDegradation:
    """Máquina de estados que simula el desgaste acumulado de un filtro.

    El propósito de la degradación progresiva es evitar saltos bruscos entre
    estados: el filtro recorre NORMAL -> ALERTA -> CRITICO a lo largo de muchos
    ciclos y, al llegar al final, se "reemplaza" (reset) volviendo a NORMAL.
    """

    def __init__(self) -> None:
        # Contador de ciclos transcurridos desde el último reemplazo del filtro.
        self.cycle: int = 0
        # Estado actual del filtro.
        self.phase: str = "NORMAL"
        # Duración (en ciclos) de la fase NORMAL; se elige al azar para variar
        # el ritmo de degradación entre distintos "filtros".
        self.phase_duration: int = random.randint(60, 120)

    def _reset(self) -> None:
        """Simula el cambio físico del filtro: vuelve a condiciones óptimas."""
        self.cycle = 0
        self.phase = "NORMAL"
        self.phase_duration = random.randint(60, 120)

    def next_state(self) -> str:
        """Avanza un ciclo y devuelve el estado actual del filtro.

        - [0, phase_duration)         -> NORMAL
        - [phase_duration, 2*dur)     -> ALERTA
        - [2*phase_duration, ...]     -> CRITICO (y luego se resetea)
        """
        self.cycle += 1

        if self.cycle < self.phase_duration:
            self.phase = "NORMAL"
        elif self.cycle < 2 * self.phase_duration:
            self.phase = "ALERTA"
        else:
            self.phase = "CRITICO"
            # Tras un margen en estado crítico, simulamos el reemplazo del filtro
            # para reiniciar el ciclo de vida (con algo de aleatoriedad).
            if self.cycle >= 2 * self.phase_duration + random.randint(20, 40):
                self._reset()
                self.phase = "NORMAL"

        return self.phase
