// alertService.js
// Lógica de negocio para la generación de alertas a partir del análisis de IA.
// Decide la severidad, persiste SIEMPRE la alerta en BD, la emite por Socket.IO
// y envía un correo de notificación con un cooldown en memoria para evitar spam.

const { insertAlert } = require('../database/queries');
const { sendAlertEmail } = require('./emailService');

// Mapeo del estado del análisis -> configuración de la alerta a crear.
// Solo los estados 'CRITICO' y 'ALERTA' generan alerta; 'NORMAL' no.
const STATE_TO_ALERT = {
  CRITICO: { severity: 'ALTA', alert_type: 'ESTADO_CRITICO' },
  ALERTA: { severity: 'MEDIA', alert_type: 'ESTADO_ALERTA' },
};

// ----------------------------------------------------------------------------
// Cooldown de correos en memoria
// El simulador genera datos cada segundo; sin control mandaríamos un email por
// segundo (spam masivo). Guardamos el último envío por clave "filterId:severity"
// y solo reenviamos cuando han pasado COOLDOWN_MINUTES.
//
// NOTA: 15 min para producción. Bajar a 1-2 para probar; subir antes de la demo.
// ----------------------------------------------------------------------------
const COOLDOWN_MINUTES = 15;

// { "FILTRO-001:ALTA": <timestamp ms>, ... }
const lastEmailSent = {};

/**
 * Determina si corresponde enviar un correo según el cooldown.
 * Si procede, actualiza el timestamp del último envío.
 * @param {string} filterId - Identificador del filtro.
 * @param {string} severity - Severidad de la alerta (ALTA/MEDIA).
 * @returns {boolean} true si se debe enviar el correo; false si está en cooldown.
 */
function shouldSendEmail(filterId, severity) {
  const key = `${filterId}:${severity}`;
  const now = Date.now();
  const last = lastEmailSent[key];
  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;

  // Primer envío para esta clave o ya venció el cooldown: se permite enviar.
  if (last === undefined || now - last >= cooldownMs) {
    lastEmailSent[key] = now;
    return true;
  }

  // Aún dentro del cooldown: informamos cuántos minutos faltan y bloqueamos.
  const remainingMin = Math.ceil((cooldownMs - (now - last)) / 60000);
  console.log(
    `[AlertService] Cooldown activo para ${key}, faltan ${remainingMin} min`
  );
  return false;
}

/**
 * Reinicia el cooldown de un filtro (todas sus severidades).
 * Se llama cuando el estado vuelve a NORMAL, de modo que la próxima alerta real
 * dispare un correo de inmediato sin esperar el cooldown anterior.
 * @param {string} filterId - Identificador del filtro.
 */
function resetCooldown(filterId) {
  Object.keys(lastEmailSent).forEach((key) => {
    if (key.startsWith(`${filterId}:`)) {
      delete lastEmailSent[key];
    }
  });
}

/**
 * Evalúa un análisis y, si el estado lo amerita, crea una alerta, la emite por
 * Socket.IO y envía un correo (respetando el cooldown). La alerta SIEMPRE se
 * guarda en BD aunque el correo se omita por cooldown.
 * @param {Object} sensorData - Lectura de sensores que originó el análisis.
 * @param {Object} analysis - Resultado del análisis (debe incluir `state`).
 * @param {string} filterId - Identificador del filtro.
 * @param {import('socket.io').Server|null} [io=null] - Instancia de Socket.IO opcional.
 * @returns {Promise<Object|null>} La alerta creada o null si no corresponde crearla.
 */
async function checkAndCreateAlerts(sensorData, analysis, filterId, io = null) {
  try {
    const state = analysis && analysis.state;

    // Estado normal: limpiamos el cooldown y no creamos alerta.
    if (state === 'NORMAL') {
      resetCooldown(filterId);
      return null;
    }

    const config = STATE_TO_ALERT[state];

    // Estado desconocido (ni NORMAL ni mapeado): no se crea alerta.
    if (!config) {
      return null;
    }

    // 1) Persistir SIEMPRE la alerta en BD (historial completo, independiente del cooldown).
    const alert = await insertAlert({
      filter_id: filterId,
      alert_type: config.alert_type,
      severity: config.severity,
      message:
        analysis.recommendation ||
        `Filtro ${filterId} en estado ${state}. Revisión recomendada.`,
      // Guardamos las métricas del sensor que motivaron la alerta para auditoría.
      sensor_values: {
        turbidity: sensorData.turbidity,
        pressure: sensorData.pressure,
        flow_rate: sensorData.flow_rate,
        temperature: sensorData.temperature,
      },
    });

    // 2) Emitir en tiempo real al frontend si tenemos la instancia de Socket.IO.
    if (io) {
      io.emit('alert:new', alert);
    }

    // 3) Enviar correo solo si el cooldown lo permite. El envío NO debe bloquear
    //    ni romper el flujo principal: va en su propio try/catch.
    if (shouldSendEmail(filterId, config.severity)) {
      try {
        await sendAlertEmail({
          filterId,
          state,
          severity: config.severity,
          turbidity: sensorData.turbidity,
          pressure: sensorData.pressure,
          flow_rate: sensorData.flow_rate,
          temperature: sensorData.temperature,
          health_score: analysis.health_score,
          recommendation:
            analysis.recommendation ||
            `Filtro ${filterId} en estado ${state}. Revisión recomendada.`,
        });
        console.log(
          `[AlertService] ✅ Email enviado a ${process.env.ALERT_EMAIL} (${config.severity})`
        );
      } catch (emailErr) {
        console.error(
          '[AlertService] ❌ Error email (no crítico):',
          emailErr.message
        );
      }
    }

    return alert;
  } catch (err) {
    console.error('[alertService] Error creando alerta:', err.message);
    throw err;
  }
}

module.exports = { checkAndCreateAlerts };
