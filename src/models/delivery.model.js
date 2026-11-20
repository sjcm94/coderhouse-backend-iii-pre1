const mongoose = require('mongoose');
const { DELIVERY_STATUS } = require('../constants');

const deliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    required() {
      return this.status !== DELIVERY_STATUS.PENDING;
    },
  },
  status: { type: String, required: true, enum: Object.values(DELIVERY_STATUS) },
});

module.exports = mongoose.model('Delivery', deliverySchema);
