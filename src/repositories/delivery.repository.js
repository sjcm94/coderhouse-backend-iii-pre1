const Delivery = require('../models/delivery.model');

const fields = '_id orderId driverId status';

function getAll(status) {
  const filter = status === undefined ? {} : { status };
  return Delivery.find(filter).select(fields).sort({ _id: 1 }).lean();
}

function getById(id) {
  return Delivery.findById(id).select(fields).lean();
}

module.exports = { getAll, getById };
