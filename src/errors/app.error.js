const dictionary = require('./dictionary');

class AppError extends Error {
  constructor(code, options) {
    const knownCode = Object.hasOwn(dictionary, code) ? code : 'INTERNAL_ERROR';
    const { status, message } = dictionary[knownCode];

    super(message, options);
    this.name = 'AppError';
    this.code = knownCode;
    this.status = status;
  }
}

module.exports = AppError;
