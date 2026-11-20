const mongoose = require('mongoose');
const User = require('../models/user.model');
const { logger } = require('../config/logger');

async function connect(uri, options) {
  await mongoose.connect(uri, options);
  // Esperamos el índice único antes de aceptar altas de usuarios.
  await User.init();
  logger.info('Conexión a MongoDB establecida');
}

function disconnect() {
  return mongoose.disconnect();
}

module.exports = { connect, disconnect };
