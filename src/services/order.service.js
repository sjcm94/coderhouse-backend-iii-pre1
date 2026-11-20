const orderRepository = require('../repositories/order.repository');
const AppError = require('../errors/app.error');
const { ORDER_STATUS } = require('../constants');
const { validateId, validateStatus } = require('./shipment-validation');

function getAll(status) {
  validateStatus(status, ORDER_STATUS);
  return orderRepository.getAll(status);
}

async function getById(id) {
  validateId(id);
  const order = await orderRepository.getById(id);
  if (!order) throw new AppError('ORDER_NOT_FOUND');

  return order;
}

module.exports = { getAll, getById };
