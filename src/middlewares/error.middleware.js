const AppError = require('../errors/app.error');
const { logger } = require('../config/logger');

const BODY_ERROR_CODES = Object.freeze({
  'entity.parse.failed': 'INVALID_JSON',
  'entity.too.large': 'BODY_TOO_LARGE',
  'charset.unsupported': 'UNSUPPORTED_BODY_ENCODING',
  'encoding.unsupported': 'UNSUPPORTED_BODY_ENCODING',
});

function notFound(req, res, next) {
  next(new AppError('ROUTE_NOT_FOUND'));
}

function handleError(error, req, res, next) {
  const appError = error instanceof AppError
    ? error
    : new AppError(BODY_ERROR_CODES[error.type] ?? 'INTERNAL_ERROR');

  const level = appError.status >= 500 || res.headersSent ? 'error' : 'warning';
  logger.log(level, appError.message, {
    codigo: appError.code,
    metodo: req.method,
    ruta: req.path.slice(0, 160),
    tipo: error.cause?.name ?? error.name,
  });

  if (res.headersSent) return next(error);

  res.status(appError.status).json({
    error: { code: appError.code, message: appError.message },
  });
}

module.exports = { notFound, handleError };
