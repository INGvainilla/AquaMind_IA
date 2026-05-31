// emailService.js
// Construye y envía el correo de alerta con un reporte visual completo del
// estado del filtro (health score + sensores + recomendación).

const { sendEmail } = require('../config/email');

/**
 * Construye el HTML del correo de alerta a partir de los datos del análisis.
 * @param {Object} alertData - Datos de la alerta y sensores.
 * @returns {string} HTML listo para enviar.
 */
function buildAlertEmailHtml(alertData) {
  const { filterId, state, severity, turbidity, pressure, flow_rate, temperature, health_score, recommendation } = alertData;
  const stateColor   = state === 'CRITICO' ? '#ef4444' : '#eab308';
  const severityText = state === 'CRITICO' ? '🔴 CRÍTICO' : '🟡 ALERTA';
  const now = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });

  // Función helper para colorear valores según umbrales
  function turbidityColor(v)  { return v > 6 ? '#ef4444' : v > 3 ? '#eab308' : '#22c55e'; }
  function pressureColor(v)   { return v > 80 ? '#ef4444' : v > 60 ? '#eab308' : '#22c55e'; }
  function flowColor(v)       { return v < 25 ? '#ef4444' : v < 40 ? '#eab308' : '#22c55e'; }
  function tempColor(v)       { return v > 35 ? '#ef4444' : v > 25 ? '#eab308' : '#22c55e'; }
  function scoreColor(s)      { return s < 30 ? '#ef4444' : s < 60 ? '#eab308' : '#22c55e'; }

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- HEADER -->
          <tr>
            <td style="background:#0f172a;padding:28px 36px;text-align:center;">
              <div style="font-size:28px;font-weight:bold;color:#38bdf8;letter-spacing:1px;">💧 AquaMind AI</div>
              <div style="color:#94a3b8;font-size:13px;margin-top:4px;">Sistema de Monitoreo Predictivo de Filtros · Bolivia</div>
            </td>
          </tr>

          <!-- ESTADO ALERTA BANNER -->
          <tr>
            <td style="background:${stateColor}18;border-left:5px solid ${stateColor};padding:20px 36px;">
              <div style="font-size:22px;font-weight:bold;color:${stateColor};">${severityText} — Acción requerida</div>
              <div style="color:#475569;font-size:14px;margin-top:4px;">Filtro: <strong>${filterId}</strong> &nbsp;|&nbsp; ${now}</div>
            </td>
          </tr>

          <!-- HEALTH SCORE -->
          <tr>
            <td style="padding:28px 36px 8px;text-align:center;">
              <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Health Score del Filtro</div>
              <div style="font-size:64px;font-weight:bold;color:${scoreColor(health_score)};font-family:monospace;line-height:1;">
                ${health_score}<span style="font-size:28px;color:#94a3b8;">/100</span>
              </div>
              <div style="display:inline-block;margin-top:12px;padding:6px 18px;border-radius:999px;background:${stateColor}22;color:${stateColor};font-weight:bold;font-size:14px;">
                Estado: ${state}
              </div>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr><td style="padding:8px 36px;"><hr style="border:none;border-top:1px solid #e2e8f0;"></td></tr>

          <!-- REPORTE DE SENSORES -->
          <tr>
            <td style="padding:8px 36px 20px;">
              <div style="font-size:14px;font-weight:bold;color:#1e293b;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px;">📊 Reporte de Sensores</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr style="background:#f8fafc;">
                  <th style="text-align:left;padding:10px 14px;font-size:12px;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Sensor</th>
                  <th style="text-align:right;padding:10px 14px;font-size:12px;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Valor</th>
                  <th style="text-align:right;padding:10px 14px;font-size:12px;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Unidad</th>
                  <th style="text-align:right;padding:10px 14px;font-size:12px;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Rango Normal</th>
                </tr>
                <tr>
                  <td style="padding:12px 14px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;">💧 Turbidez</td>
                  <td style="padding:12px 14px;font-size:16px;font-weight:bold;color:${turbidityColor(turbidity)};text-align:right;font-family:monospace;border-bottom:1px solid #f1f5f9;">${turbidity}</td>
                  <td style="padding:12px 14px;font-size:13px;color:#64748b;text-align:right;border-bottom:1px solid #f1f5f9;">NTU</td>
                  <td style="padding:12px 14px;font-size:12px;color:#94a3b8;text-align:right;border-bottom:1px solid #f1f5f9;">1 – 3</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:12px 14px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;">⚡ Presión</td>
                  <td style="padding:12px 14px;font-size:16px;font-weight:bold;color:${pressureColor(pressure)};text-align:right;font-family:monospace;border-bottom:1px solid #f1f5f9;">${pressure}</td>
                  <td style="padding:12px 14px;font-size:13px;color:#64748b;text-align:right;border-bottom:1px solid #f1f5f9;">PSI</td>
                  <td style="padding:12px 14px;font-size:12px;color:#94a3b8;text-align:right;border-bottom:1px solid #f1f5f9;">30 – 50</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;">🌊 Caudal</td>
                  <td style="padding:12px 14px;font-size:16px;font-weight:bold;color:${flowColor(flow_rate)};text-align:right;font-family:monospace;border-bottom:1px solid #f1f5f9;">${flow_rate}</td>
                  <td style="padding:12px 14px;font-size:13px;color:#64748b;text-align:right;border-bottom:1px solid #f1f5f9;">L/min</td>
                  <td style="padding:12px 14px;font-size:12px;color:#94a3b8;text-align:right;border-bottom:1px solid #f1f5f9;">40 – 60</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:12px 14px;font-size:14px;color:#1e293b;">🌡️ Temperatura</td>
                  <td style="padding:12px 14px;font-size:16px;font-weight:bold;color:${tempColor(temperature)};text-align:right;font-family:monospace;">${temperature}</td>
                  <td style="padding:12px 14px;font-size:13px;color:#64748b;text-align:right;">°C</td>
                  <td style="padding:12px 14px;font-size:12px;color:#94a3b8;text-align:right;">15 – 25</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- RECOMENDACIÓN -->
          <tr>
            <td style="padding:0 36px 28px;">
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
                <div style="font-size:12px;font-weight:bold;color:#16a34a;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">✅ Recomendación del Sistema</div>
                <div style="font-size:14px;color:#166534;line-height:1.6;">${recommendation}</div>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center;">
              <div style="font-size:12px;color:#94a3b8;">Este es un mensaje automático de <strong>AquaMind AI</strong></div>
              <div style="font-size:11px;color:#cbd5e1;margin-top:4px;">Hackathon Bolivia 2026 · Santa Cruz de la Sierra</div>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

/**
 * Envía el correo de alerta al destinatario configurado en ALERT_EMAIL.
 * @param {Object} alertData - { filterId, state, severity, turbidity, pressure,
 *   flow_rate, temperature, health_score, recommendation }
 * @returns {Promise<void>}
 */
async function sendAlertEmail(alertData) {
  const to = process.env.ALERT_EMAIL;
  const subject = `[AquaMind] ⚠️ Filtro ${alertData.filterId} en estado ${alertData.state}`;
  const html = buildAlertEmailHtml(alertData);
  await sendEmail(to, subject, html);
}

module.exports = { sendAlertEmail, buildAlertEmailHtml };
