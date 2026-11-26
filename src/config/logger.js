const path = require('node:path');
const winston = require('winston');

const levels = {
  fatal: 0,
  error: 1,
  warning: 2,
  info: 3,
  http: 4,
  debug: 5,
};

const consoleTransport = new winston.transports.Console({
  level: 'info',
  stderrLevels: ['error', 'fatal'],
});

const fileTransport = new winston.transports.File({
  filename: path.join(__dirname, '../../logs/error.log'),
  level: 'error',
  maxsize: 1024 * 1024,
  maxFiles: 3,
  tailable: true,
});

const logger = winston.createLogger({
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...details }) => {
      const context = Object.keys(details).length ? ` ${JSON.stringify(details)}` : '';
      return `${timestamp} [${level}] ${message}${context}`;
    }),
  ),
  transports: [consoleTransport, fileTransport],
});

logger.on('error', () => {
  process.stderr.write('Winston no pudo escribir en el archivo de logs.\n');
});

function configureLogger(level) {
  consoleTransport.level = level;
}

module.exports = { logger, configureLogger };
