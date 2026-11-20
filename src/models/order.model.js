const mongoose = require('mongoose');
const { ORDER_STATUS, ORDER_PRIORITY } = require('../constants');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, required: true, enum: Object.values(ORDER_STATUS) },
  priority: { type: String, required: true, enum: Object.values(ORDER_PRIORITY) },
});

module.exports = mongoose.model('Order', orderSchema);
