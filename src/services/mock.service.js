const { randomBytes, randomInt } = require('node:crypto');
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

  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;

  const qty = Number(value);
  return qty >= 1 && qty <= MAX_QTY ? qty : null;
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

function previewUsers(qty) {
  return makeMixedUsers(qty).map(({ name, email, role }) => {
    return { nombre: name, email, rol: ROLE_LABELS[role] };
  });
}

function previewBatch(qty) {
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

async function seed(qty, collection) {
  if (collection === 'users') {
    const inserted = await mockRepository.insertBatch({ users: makeMixedUsers(qty) });
    return { insertados: inserted, coleccion: 'usuarios' };
  }

  const { users, drivers, orders, deliveries } = previewBatch(qty);
  const inserted = await mockRepository.insertBatch({
    users: [...users, ...drivers],
    orders,
    deliveries,
  });
  return { insertados: inserted, coleccion: 'todas' };
}

module.exports = { readQuantity, previewUsers, previewBatch, seed };
