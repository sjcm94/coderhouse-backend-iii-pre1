const Order = require('../models/order.model');

const fields = '_id userId status priority items';

function getAll(status, { skip, limit }) {
  const filter = status === undefined ? {} : { status };
  return Order.find(filter)
    .select(fields)
    .sort({ _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

function getById(id) {
  return Order.findById(id).select(fields).lean();
}

async function create(data) {
  const order = await Order.create(data);
  const { _id, userId, status, priority, items } = order.toObject();
  return { _id, userId, status, priority, items };
}

module.exports = { getAll, getById, create };
