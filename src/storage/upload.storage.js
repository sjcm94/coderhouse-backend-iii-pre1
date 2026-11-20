const { mkdir, writeFile, unlink } = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DOCUMENT_DESTINATIONS, SUPPORTED_FILES } = require('../config/upload.config');
const { logger } = require('../config/logger');

async function removeFile(fullPath) {
  try {
    await unlink(fullPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error('No se pudo limpiar un archivo de carga', { codigo: error.code });
    }
  }
}

async function saveFile(file, documentType) {
  const { uploadsDir } = require('../config');
  const folder = DOCUMENT_DESTINATIONS[documentType];
  const filename = randomUUID() + SUPPORTED_FILES[file.mimetype];
  const directory = path.join(uploadsDir, folder);
  const fullPath = path.join(directory, filename);
  await mkdir(directory, { recursive: true });

  try {
    await writeFile(fullPath, file.buffer, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') await removeFile(fullPath);
    throw error;
  }

  const metadata = {
    originalName: file.originalname,
    filename,
    path: path.posix.join('uploads', folder, filename),
    mimeType: file.mimetype,
    size: file.size,
    documentType,
    uploadedAt: new Date(),
  };

  return { fullPath, metadata };
}

module.exports = { saveFile, removeFile };
