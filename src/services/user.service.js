const { pagination } = require('./pagination');
const AppError = require('../errors/app.error');
const userRepository = require('../repositories/user.repository');
const { validateId } = require('./shipment-validation');
const { validateFile, associateFile } = require('./upload.service');
const { USER_ROLES, DOCUMENT_TYPE } = require('../utils/constants');

function getAll(query) {
  return userRepository.getAll(pagination(query));
}

async function create(data = {}) {
  const { name, email } = data ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    throw new AppError('INVALID_USER_NAME');
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AppError('INVALID_EMAIL');
  }

  const user = await userRepository.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: USER_ROLES.USER,
  });

  if (user === null) throw new AppError('EMAIL_ALREADY_EXISTS');

  return user;
}

async function uploadFile(id, file, documentType) {
  validateId(id);
  validateFile(file);
  if (documentType !== DOCUMENT_TYPE.IDENTITY && documentType !== DOCUMENT_TYPE.LICENSE) {
    throw new AppError('INVALID_DOCUMENT_TYPE');
  }

  const user = await userRepository.getById(id);
  if (!user) throw new AppError('USER_NOT_FOUND');

  return associateFile({
    file,
    documentType,
    persist: (metadata) => userRepository.addFile(id, metadata),
    notFoundCode: 'USER_NOT_FOUND',
  });
}

module.exports = { getAll, create, uploadFile };
