const { pagination } = require('./pagination');
const deliveryRepository = require('../repositories/delivery.repository');
const AppError = require('../errors/app.error');
const { DELIVERY_STATUS, DOCUMENT_TYPE } = require('../constants');
const { validateId, validateStatus } = require('./shipment-validation');
const { validateFile, associateFile } = require('./upload.service');

function getAll(query = {}) {
  const { status } = query;
  validateStatus(status, DELIVERY_STATUS);
  return deliveryRepository.getAll(status, pagination(query));
}

async function getById(id) {
  validateId(id);
  const delivery = await deliveryRepository.getById(id);
  if (!delivery) throw new AppError('DELIVERY_NOT_FOUND');

  return delivery;
}

async function uploadFile(id, file) {
  validateId(id);
  validateFile(file);
  await getById(id);

  return associateFile({
    file,
    documentType: DOCUMENT_TYPE.DELIVERY_PROOF,
    persist: (metadata) => deliveryRepository.addFile(id, metadata),
    notFoundCode: 'DELIVERY_NOT_FOUND',
  });
}

module.exports = { getAll, getById, uploadFile };
