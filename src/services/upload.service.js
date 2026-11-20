const AppError = require('../errors/app.error');
const { logger } = require('../config/logger');
const { MAX_FILE_SIZE, SUPPORTED_FILES } = require('../config/upload.config');
const { saveFile, removeFile } = require('../storage/upload.storage');

const signatures = {
  'application/pdf': Buffer.from('%PDF-'),
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
};

function validateFile(file) {
  if (!file || file.size === 0) throw new AppError('FILE_REQUIRED');
  if (file.size > MAX_FILE_SIZE) throw new AppError('FILE_TOO_LARGE');

  if (!Object.hasOwn(SUPPORTED_FILES, file.mimetype)) throw new AppError('INVALID_FILE_TYPE');

  const signature = signatures[file.mimetype];
  if (!file.buffer.subarray(0, signature.length).equals(signature)) {
    throw new AppError('INVALID_FILE_TYPE');
  }
}

async function associateFile({ file, documentType, persist, notFoundCode }) {
  let saved;
  let entity;

  try {
    saved = await saveFile(file, documentType);
    entity = await persist(saved.metadata);
  } catch (error) {
    if (saved) await removeFile(saved.fullPath);
    throw new AppError('FILE_SAVE_FAILED', { cause: error });
  }

  if (!entity) {
    await removeFile(saved.fullPath);
    throw new AppError(notFoundCode);
  }

  logger.info('Archivo guardado y asociado', {
    documento: saved.metadata.documentType,
    entidadId: String(entity._id),
    bytes: saved.metadata.size,
  });
  return entity;
}

module.exports = { validateFile, associateFile };
