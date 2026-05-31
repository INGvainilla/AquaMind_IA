// environment.js
// Carga y valida las variables de entorno requeridas por el backend.
// Si falta alguna variable crítica, detiene el arranque con un mensaje claro.

const dotenv = require('dotenv');

// Cargar el archivo .env hacia process.env (no falla si no existe).
dotenv.config();

// ----------------------------------------------------------------------------
// Variables críticas: sin ellas el backend no puede conectarse a la base de
// datos ni operar correctamente, por lo que su ausencia aborta el arranque.
// ----------------------------------------------------------------------------
const REQUIRED_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

// Detectar qué variables críticas faltan o están vacías.
const missing = REQUIRED_VARS.filter((key) => {
  const value = process.env[key];
  return value === undefined || value === '';
});

// Si falta alguna, lanzar error explicando exactamente qué configurar.
if (missing.length > 0) {
  throw new Error(
    `Faltan variables de entorno requeridas: ${missing.join(', ')}. ` +
      'Copia .env.example a .env y completa los valores.'
  );
}

// ----------------------------------------------------------------------------
// Variables opcionales de email: habilitan las notificaciones por correo. Si
// faltan, el backend arranca igual (solo se avisa) pero no se enviarán correos.
// ----------------------------------------------------------------------------
const OPTIONAL_EMAIL_VARS = ['EMAIL_USER', 'EMAIL_PASSWORD', 'ALERT_EMAIL'];

const missingEmail = OPTIONAL_EMAIL_VARS.filter((key) => {
  const value = process.env[key];
  return value === undefined || value === '';
});

if (missingEmail.length > 0) {
  console.warn(
    `[ENV] ⚠️ Variables de email no configuradas: ${missingEmail.join(', ')}. ` +
      'Las notificaciones por correo estarán deshabilitadas.'
  );
}

// ----------------------------------------------------------------------------
// Objeto ENV centralizado: única fuente de verdad de la configuración.
// Se aplican valores por defecto razonables a las variables no críticas.
// ----------------------------------------------------------------------------
const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 4000,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
  ALERT_EMAIL: process.env.ALERT_EMAIL || '',
};

module.exports = { ENV };
