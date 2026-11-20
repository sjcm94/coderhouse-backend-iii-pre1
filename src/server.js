async function start() {
  const config = require('./config');
  const database = require('./repositories/database');
  const app = require('./app');

  try {
    await database.connect(config.mongoUri);
    const server = app.listen(config.port);
    server.once('listening', () => {
      console.log(`ShipNow está escuchando en el puerto ${config.port} (${config.nodeEnv}).`);
    });
    server.once('error', async (error) => {
      console.error(`No se pudo abrir el puerto ${config.port} (${error.code}).`);
      process.exitCode = 1;
      await database.disconnect();
    });
  } catch {
    await database.disconnect();
    throw new Error('No se pudo iniciar MongoDB. Revisa MONGODB_URI y el acceso a la base de datos.');
  }
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
