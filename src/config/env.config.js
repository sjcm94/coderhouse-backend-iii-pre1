const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config();

const requiredVariables = ['PORT', 'MONGODB_URI', 'NODE_ENV'];

for (const name of requiredVariables) {
  if (!process.env[name]?.trim()) {
    throw new Error(`Falta la variable de entorno ${name}. Completa el archivo .env.`);
  }
}

const portText = process.env.PORT.trim();
const port = Number(portText);
const mongoUri = process.env.MONGODB_URI.trim();
const nodeEnv = process.env.NODE_ENV.trim();

if (!/^\d+$/.test(portText) || port < 1 || port > 65535) {
  throw new Error('PORT debe ser un número entero entre 1 y 65535.');
}

if (!/^mongodb(?:\+srv)?:\/\/.+/.test(mongoUri)) {
  throw new Error('MONGODB_URI debe comenzar con mongodb:// o mongodb+srv://.');
}

if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV debe ser development, test o production.');
}

const uploadsDir = path.resolve(process.env.UPLOADS_DIR?.trim() || path.join(__dirname, '../../uploads'));

module.exports = Object.freeze({
  uploadsDir,
  port,
  mongoUri,
  nodeEnv,
});
