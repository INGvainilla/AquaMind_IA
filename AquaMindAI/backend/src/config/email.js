// email.js
// Configuración del transporter de Nodemailer (Gmail) y helper de envío.
// El envío de correos NUNCA debe romper el flujo principal: ante cualquier
// fallo se loguea el error y se retorna false en lugar de lanzar excepción.

const nodemailer = require('nodemailer');

// ----------------------------------------------------------------------------
// Transporter
// Usamos el servicio 'gmail' con autenticación por App Password (no la
// contraseña normal de la cuenta). Las credenciales se leen del entorno.
// ----------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ----------------------------------------------------------------------------
// Verificación de conexión al arrancar
// Confirma que las credenciales y la conexión SMTP son válidas. Solo loguea el
// resultado; no detiene el arranque del backend si falla (los correos son una
// funcionalidad secundaria al monitoreo en tiempo real).
// ----------------------------------------------------------------------------
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter.verify((err) => {
    if (err) {
      console.error('[Email] Transporter NO disponible ❌:', err.message);
    } else {
      console.log('[Email] Transporter listo ✅');
    }
  });
} else {
  console.warn(
    '[Email] EMAIL_USER / EMAIL_PASSWORD no configurados: envío de correos deshabilitado.'
  );
}

// ----------------------------------------------------------------------------
// sendEmail
// Envía un correo HTML. Retorna true si se envió correctamente, false ante
// cualquier error (sin propagar la excepción al llamador).
// ----------------------------------------------------------------------------
/**
 * Envía un correo electrónico en formato HTML.
 * @param {string} to - Destinatario del correo.
 * @param {string} subject - Asunto del correo.
 * @param {string} html - Cuerpo del correo en HTML.
 * @returns {Promise<boolean>} true si se envió; false si hubo error.
 */
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Email] Error al enviar:', err.message);
    return false;
  }
}

module.exports = { sendEmail, transporter };
