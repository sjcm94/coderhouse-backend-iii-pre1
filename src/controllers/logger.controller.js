const { logger } = require('../config/logger');
const AppError = require('../errors/app.error');

function testLogger(req, res) {
  const { nodeEnv } = require('../config');

  if (nodeEnv === 'production') {
    throw new AppError('ROUTE_NOT_FOUND');
  }

  const levels = Object.keys(logger.levels).reverse();
  for (const level of levels) {
    logger.log(level, `Prueba del logger: ${level}`);
  }

  res.status(200).json({ message: 'Prueba del logger registrada.', niveles: levels });
}

module.exports = { testLogger };
