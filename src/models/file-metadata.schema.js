const mongoose = require('mongoose');
const { DOCUMENT_TYPE } = require('../constants');

module.exports = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true, min: 1 },
  documentType: { type: String, required: true, enum: Object.values(DOCUMENT_TYPE) },
  uploadedAt: { type: Date, required: true },
}, { _id: false });
