const deliveryRepository = require('../repositories/delivery.repository');
const AppError = require('../errors/app.error');
const { DELIVERY_STATUS } = require('../constants');
const { validateId, validateStatus } = require('./shipment-validation');

function getAll(status) {
  validateStatus(status, DELIVERY_STATUS);
  return deliveryRepository.getAll(status);
}

async function getById(id) {
  validateId(id);
  const delivery = await deliveryRepository.getById(id);
  if (!delivery) throw new AppError('DELIVERY_NOT_FOUND');

  return delivery;
}

module.exports = { getAll, getById };
