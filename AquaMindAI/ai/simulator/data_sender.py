"""Envío de lecturas de sensores al backend de AquaMind.

Encapsula la petición HTTP POST hacia el backend Node.js, gestionando timeouts
y errores de red sin propagar excepciones al loop principal del simulador.
"""

from typing import Dict

import requests

from utils.constants import BACKEND_URL


def send_to_backend(data: Dict) -> bool:
    """Envía una lectura al backend y reporta si fue aceptada.

    Devuelve True si el backend respondió con un status 2xx, False en caso de
    error (timeout, conexión rechazada, status >= 400). Nunca lanza excepción.
    """
    try:
        response = requests.post(BACKEND_URL, json=data, timeout=5)
        if 200 <= response.status_code < 300:
            print("✅ Enviado")
            return True
        print(f"❌ Error al enviar (status {response.status_code})")
        return False
    except requests.RequestException as exc:
        # Capturamos cualquier error de red para no interrumpir el simulador.
        print(f"❌ Error al enviar ({exc.__class__.__name__})")
        return False
