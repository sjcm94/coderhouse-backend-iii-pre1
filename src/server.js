const { once } = require('node:events');
const { logger, configureLogger } = require('./config/logger');

async function start() {
  const config = require('./config');
  configureLogger(config.logLevel);

  const database = require('./repositories/database');
  const app = require('./app');

  try {
    await database.connect(config.mongoUri);
  } catch (error) {
    throw new Error('No se pudo iniciar MongoDB. Revisa MONGODB_URI y el acceso a la base de datos.', {
      cause: error,
    });
  }

  const server = app.listen(config.port, '0.0.0.0');
  try {
    await once(server, 'listening');
  } catch (error) {
    throw new Error(`No se pudo abrir el puerto ${config.port} (${error.code}).`, { cause: error });
  }

  logger.info(`ShipNow está escuchando en el puerto ${config.port}`, { entorno: config.nodeEnv });

  let closing = false;
  function shutdown(signal) {
    if (closing) return;
    closing = true;
    logger.info('Cerrando ShipNow', { signal });

    server.close(async (error) => {
      try {
        if (error) throw error;
        await database.disconnect();
      } catch {
        process.exitCode = 1;
        logger.error('No se pudo cerrar ShipNow correctamente');
      } finally {
        logger.end();
      }
    });
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

start().catch(async (error) => {
  process.exitCode = 1;
  logger.fatal(error.message, { tipo: error.cause?.name ?? error.name });

  try {
    await require('./repositories/database').disconnect();
  } catch {
    logger.error('No se pudo cerrar la conexión con MongoDB.');
  }
});
