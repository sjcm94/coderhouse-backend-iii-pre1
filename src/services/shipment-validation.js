const AppError = require('../errors/app.error');

function validateId(id) {
  if (typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id)) throw new AppError('INVALID_ID');
}

function validateStatus(status, allowed) {
  if (status !== undefined && !Object.values(allowed).includes(status)) {
    throw new AppError('INVALID_STATUS');
  }
}

module.exports = { validateId, validateStatus };
