const mongoose = require('mongoose');
const User = require('../models/user.model');

async function connect(uri) {
  await mongoose.connect(uri);
  // Esperamos el índice único antes de aceptar altas de usuarios.
  await User.init();
}

function disconnect() {
  return mongoose.disconnect();
}

module.exports = { connect, disconnect };
