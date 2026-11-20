const { performance } = require('node:perf_hooks');
const { logger } = require('../config/logger');

function logRequest(req, res, next) {
  const startedAt = performance.now();
  const path = req.path.slice(0, 160);

  res.once('finish', () => {
    logger.http('Solicitud HTTP completada', {
      metodo: req.method,
      ruta: path,
      estado: res.statusCode,
      duracionMs: Math.round(performance.now() - startedAt),
    });
  });

  next();
}

module.exports = logRequest;
