const { pagination } = require('./pagination');
const orderRepository = require('../repositories/order.repository');
const userRepository = require('../repositories/user.repository');
const { logger } = require('../config/logger');
const AppError = require('../errors/app.error');
const { ORDER_STATUS, ORDER_PRIORITY, USER_ROLES } = require('../constants');
const { validateId, validateStatus } = require('./shipment-validation');

function getAll(query = {}) {
  const { status } = query;
  validateStatus(status, ORDER_STATUS);
  return orderRepository.getAll(status, pagination(query));
}

async function getById(id) {
  validateId(id);
  const order = await orderRepository.getById(id);
  if (!order) throw new AppError('ORDER_NOT_FOUND');

  return order;
}

async function create(data) {
  const { userId, items, priority = ORDER_PRIORITY.NORMAL } = data ?? {};
  validateId(userId);

  if (!Object.values(ORDER_PRIORITY).includes(priority)) {
    throw new AppError('INVALID_ORDER_PRIORITY');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('INVALID_ORDER_ITEMS');
  }

  const validItems = items.map((item) => {
    const { name, quantity } = item ?? {};
    if (typeof name !== 'string' || !name.trim() || !Number.isSafeInteger(quantity) || quantity < 1) {
      throw new AppError('INVALID_ORDER_ITEMS');
    }
    return { name: name.trim(), quantity };
  });

  const user = await userRepository.getById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND');
  if (user.role !== USER_ROLES.USER) throw new AppError('INVALID_ORDER_USER');

  const order = await orderRepository.create({
    userId,
    priority,
    items: validItems,
    status: ORDER_STATUS.PENDING,
  });
  logger.info('Pedido creado', { pedidoId: String(order._id) });
  return order;
}

module.exports = { getAll, getById, create };
