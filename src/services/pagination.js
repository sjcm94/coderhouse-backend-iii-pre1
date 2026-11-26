const AppError = require('../errors/app.error');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_PAGE = 1000;

function readInteger(value, fallback, maximum) {
  if (value === undefined) return fallback;

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new AppError('INVALID_PAGINATION');
  }

  const number = Number(value);
  if (number < 1 || number > maximum) throw new AppError('INVALID_PAGINATION');
  return number;
}

function pagination(query = {}) {
  const page = readInteger(query.page, 1, MAX_PAGE);
  const limit = readInteger(query.limit, DEFAULT_LIMIT, MAX_LIMIT);
  return { skip: (page - 1) * limit, limit };
}

module.exports = { pagination, DEFAULT_LIMIT, MAX_LIMIT, MAX_PAGE };
