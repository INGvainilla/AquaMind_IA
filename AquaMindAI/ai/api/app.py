"""API Flask del servicio de IA de AquaMind.

Expone el endpoint /analyze que diagnostica una lectura de sensores y un /health
para chequeos. Mantiene una única instancia de AnalysisEngine en memoria.
"""

import os
import sys

# Permite ejecutar `python api/app.py` desde la carpeta ai/ resolviendo los
# imports de paquetes hermanos (utils, services) al añadir la raíz de ai/ al path.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, request
from flask_cors import CORS

from services.analysis_engine import AnalysisEngine

app = Flask(__name__)
CORS(app)  # Habilita CORS para que el backend/cliente puedan llamar a la API.

# Instancia global: conserva el historial de lecturas entre peticiones para que
# el Isolation Forest pueda reentrenarse con datos acumulados.
analysis_engine = AnalysisEngine()

# Campos obligatorios en el cuerpo de /analyze.
REQUIRED_FIELDS = ["turbidity", "pressure", "flow_rate", "temperature"]


@app.route("/analyze", methods=["POST"])
def analyze():
    """Recibe una lectura de sensores y devuelve el diagnóstico del filtro."""
    data = request.get_json(silent=True) or {}

    # Validar que estén presentes todas las métricas necesarias.
    missing = [f for f in REQUIRED_FIELDS if data.get(f) is None]
    if missing:
        return (
            jsonify({"error": f"Faltan campos requeridos: {', '.join(missing)}"}),
            400,
        )

    reading = {
        "turbidity": float(data["turbidity"]),
        "pressure": float(data["pressure"]),
        "flow_rate": float(data["flow_rate"]),
        "temperature": float(data["temperature"]),
    }

    # Acumular la lectura en el historial y analizarla.
    analysis_engine.add_reading(**reading)
    result = analysis_engine.analyze(reading)

    return jsonify(result), 200


@app.route("/health", methods=["GET"])
def health():
    """Chequeo de salud del servicio de IA."""
    return jsonify({"status": "ok", "service": "AquaMind AI Service"}), 200


if __name__ == "__main__":
    # Servicio independiente en el puerto 5000 (debug desactivado).
    app.run(host="0.0.0.0", port=5000, debug=False)
