"""Punto de entrada del simulador de sensores de AquaMind.

Genera una lectura de sensores cada SEND_INTERVAL segundos, la muestra en consola
y la envía al backend, simulando un filtro real instalado en campo.
"""

import time

from utils.constants import BACKEND_URL, FILTER_ID, SEND_INTERVAL
from simulator.sensor_generator import SensorGenerator
from simulator.data_sender import send_to_backend


def main() -> None:
    """Ejecuta el loop principal del simulador hasta interrupción manual."""
    generator = SensorGenerator()
    print(f"🤖 AquaMind Simulador iniciado - enviando datos cada {SEND_INTERVAL}s")
    print(f"   Filtro: {FILTER_ID}")
    print(f"   Backend destino: {BACKEND_URL}")
    print("   (Ctrl+C para detener)\n")

    try:
        while True:
            reading = generator.generate_reading(FILTER_ID)

            # Resumen legible de la lectura generada.
            print(
                f"[{reading['timestamp']}] estado={reading['status']:<8} "
                f"turbidez={reading['turbidity']:<6} presión={reading['pressure']:<6} "
                f"caudal={reading['flow_rate']:<6} temp={reading['temperature']}"
            )

            send_to_backend(reading)
            time.sleep(SEND_INTERVAL)
    except KeyboardInterrupt:
        # Salida limpia ante Ctrl+C.
        print("\n👋 Simulador detenido por el usuario. ¡Hasta luego!")


if __name__ == "__main__":
    main()
