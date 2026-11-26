const mongoose = require('mongoose');
const fileMetadata = require('./file-metadata.schema');
const { DELIVERY_STATUS } = require('../constants');

const deliverySchema = new mongoose.Schema({
  proofs: { type: [fileMetadata], default: undefined },
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

deliverySchema.index({ status: 1, _id: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
