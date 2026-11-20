const { randomBytes, randomInt } = require('node:crypto');
const AppError = require('../errors/app.error');
const mockRepository = require('../repositories/mock.repository');
const { USER_ROLES, ORDER_STATUS, ORDER_PRIORITY, DELIVERY_STATUS } = require('../constants');

const DEFAULT_QTY = 10;
const MAX_QTY = 100;
const FIRST_NAMES = ['Ana', 'Luis', 'María', 'Diego', 'Lucía', 'Pablo'];
const LAST_NAMES = ['Pérez', 'Gómez', 'Torres', 'Ruiz', 'Mora', 'Vega'];
const ROLE_LABELS = Object.freeze({
  [USER_ROLES.USER]: 'cliente',
  [USER_ROLES.DRIVER]: 'repartidor',
});
const DELIVERY_BY_ORDER = Object.freeze({
  [ORDER_STATUS.PENDING]: DELIVERY_STATUS.PENDING,
  [ORDER_STATUS.IN_TRANSIT]: DELIVERY_STATUS.IN_TRANSIT,
  [ORDER_STATUS.DELIVERED]: DELIVERY_STATUS.DELIVERED,
});

function readQuantity(value) {
  if (value === undefined) return DEFAULT_QTY;

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new AppError('INVALID_MOCK_QUANTITY');
  }

  const qty = Number(value);
  if (qty < 1 || qty > MAX_QTY) {
    throw new AppError('INVALID_MOCK_QUANTITY');
  }

  return qty;
}

function newId() {
  return randomBytes(12).toString('hex');
}

function makeUser(role) {
  const _id = newId();
  const firstName = FIRST_NAMES[randomInt(FIRST_NAMES.length)];
  const lastName = LAST_NAMES[randomInt(LAST_NAMES.length)];

  return {
    _id,
    name: `${firstName} ${lastName}`,
    email: `shipnow.${_id}@example.com`,
    role,
  };
}

function makeMixedUsers(qty) {
  return Array.from({ length: qty }, (_, index) => {
    return makeUser(index % 2 === 0 ? USER_ROLES.USER : USER_ROLES.DRIVER);
  });
}

function previewUsers(value) {
  return makeMixedUsers(readQuantity(value)).map(({ name, email, role }) => {
    return { nombre: name, email, rol: ROLE_LABELS[role] };
  });
}

function makeBatch(qty) {
  const users = Array.from({ length: qty }, () => makeUser(USER_ROLES.USER));
  const drivers = Array.from({ length: qty }, () => makeUser(USER_ROLES.DRIVER));
  const statuses = [ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.DELIVERED, ORDER_STATUS.PENDING];
  const priorities = Object.values(ORDER_PRIORITY);

  const orders = users.map((user, index) => ({
    _id: newId(),
    userId: user._id,
    status: statuses[index % statuses.length],
    priority: priorities[index % priorities.length],
  }));

  const deliveries = orders.map((order, index) => ({
    _id: newId(),
    orderId: order._id,
    driverId: order.status === ORDER_STATUS.PENDING ? null : drivers[index]._id,
    status: DELIVERY_BY_ORDER[order.status],
  }));

  return { users, drivers, orders, deliveries };
}

function previewBatch(value) {
  return makeBatch(readQuantity(value));
}

async function seed(value, collection = 'users') {
  const { nodeEnv } = require('../config');
  if (nodeEnv === 'production') {
    throw new AppError('MOCK_SEED_FORBIDDEN');
  }

  const qty = readQuantity(value);
  if (collection !== 'users' && collection !== 'all') {
    throw new AppError('INVALID_MOCK_COLLECTION');
  }

  try {
    if (collection === 'users') {
      const inserted = await mockRepository.insertBatch({ users: makeMixedUsers(qty) });
      return { insertados: inserted, coleccion: 'usuarios' };
    }

    const { users, drivers, orders, deliveries } = makeBatch(qty);
    const inserted = await mockRepository.insertBatch({
      users: [...users, ...drivers],
      orders,
      deliveries,
    });
    return { insertados: inserted, coleccion: 'todas' };
  } catch (error) {
    throw new AppError('MOCK_SEED_FAILED', { cause: error });
  }
}

module.exports = { previewUsers, previewBatch, seed };
