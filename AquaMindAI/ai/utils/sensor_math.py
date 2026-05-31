"""Cálculos puros del estado de salud de un filtro de agua.

Convierte las lecturas crudas de los sensores en un puntaje de salud (0-100) y
deriva de él el estado, la vida útil estimada y la recomendación de mantenimiento.
"""


def calculate_health_score(
    turbidity: float,
    pressure: float,
    flow_rate: float,
    temperature: float,
) -> int:
    """Calcula un puntaje de salud (0-100) penalizando valores fuera de rango.

    A mayor desviación de las condiciones óptimas, mayor penalización.
    """
    # Partimos de un filtro perfecto y restamos según cada anomalía detectada.
    score = 100

    # Penalizar turbidez: el agua turbia es el síntoma más grave de saturación.
    if turbidity > 6:
        score -= 40
    elif turbidity > 3:
        score -= 20
    elif turbidity > 1.5:
        score -= 10

    # Penalizar presión: la sobrepresión indica obstrucción del medio filtrante.
    if pressure > 80:
        score -= 30
    elif pressure > 60:
        score -= 15
    elif pressure > 50:
        score -= 5

    # Penalizar caudal bajo: poco flujo sugiere que el filtro está tapado.
    if flow_rate < 25:
        score -= 30
    elif flow_rate < 40:
        score -= 15
    elif flow_rate < 50:
        score -= 5

    # Penalizar temperatura alta: favorece crecimiento microbiano y desgaste.
    if temperature > 35:
        score -= 15
    elif temperature > 25:
        score -= 5

    # Acotar el resultado al rango válido 0-100.
    return max(0, min(100, score))


def determine_state(health_score: int) -> str:
    """Traduce el puntaje de salud a un estado discreto del filtro."""
    if health_score < 30:
        return "CRITICO"
    if health_score < 60:
        return "ALERTA"
    return "NORMAL"


def estimate_remaining_life(health_score: int) -> str:
    """Estima (de forma cualitativa) la vida útil restante según el puntaje."""
    if health_score < 30:
        return "12-36 horas"
    if health_score < 60:
        return "3-7 días"
    return "15-30 días"


def get_recommendation(state: str) -> str:
    """Devuelve la recomendación de mantenimiento en español según el estado."""
    recommendations = {
        "CRITICO": (
            "Estado crítico: reemplace el filtro de inmediato. La calidad del "
            "agua está comprometida y existe riesgo de falla total."
        ),
        "ALERTA": (
            "Estado de alerta: programe el mantenimiento del filtro en los "
            "próximos días y monitoree la turbidez y la presión."
        ),
        "NORMAL": (
            "Estado normal: el filtro opera correctamente. Continúe con el "
            "monitoreo rutinario."
        ),
    }
    return recommendations.get(state, "Estado desconocido: verifique los sensores.")
