const mongoose = require('mongoose');
const fileMetadata = require('./file-metadata.schema');
const { USER_ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema({
  documents: { type: [fileMetadata], default: undefined },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  role: { type: String, required: true, enum: Object.values(USER_ROLES) },
});

module.exports = mongoose.model('User', userSchema);
