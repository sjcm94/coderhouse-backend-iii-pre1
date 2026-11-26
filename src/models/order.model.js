const mongoose = require('mongoose');
const { ORDER_STATUS, ORDER_PRIORITY } = require('../constants');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, required: true, enum: Object.values(ORDER_STATUS) },
  items: { type: [itemSchema], default: [] },
  priority: { type: String, required: true, enum: Object.values(ORDER_PRIORITY) },
});

orderSchema.index({ status: 1, _id: 1 });

module.exports = mongoose.model('Order', orderSchema);
