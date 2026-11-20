const mongoose = require('mongoose');
const { PRODUCT_STATUS } = require('../utils/constants');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  status: { type: String, required: true, enum: Object.values(PRODUCT_STATUS) },
});

module.exports = mongoose.model('Product', productSchema);
