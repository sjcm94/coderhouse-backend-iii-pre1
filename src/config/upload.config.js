const multer = require('multer');
const AppError = require('../errors/app.error');
const { DOCUMENT_TYPE } = require('../constants');

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const FILE_FIELD = 'file';
const SUPPORTED_FILES = Object.freeze({
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
});
const DOCUMENT_DESTINATIONS = Object.freeze({
  [DOCUMENT_TYPE.IDENTITY]: 'user-documents',
  [DOCUMENT_TYPE.LICENSE]: 'licenses',
  [DOCUMENT_TYPE.DELIVERY_PROOF]: 'delivery-proofs',
});

const parseFile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE + 1,
    files: 1,
    fields: 1,
    parts: 3,
    fieldNameSize: 64,
    fieldSize: 128,
  },
  fileFilter(req, file, done) {
    if (!Object.hasOwn(SUPPORTED_FILES, file.mimetype)) {
      return done(new AppError('INVALID_FILE_TYPE'));
    }
    done(null, true);
  },
}).single(FILE_FIELD);

function receiveFile(allowedFields) {
  return (req, res, next) => {
    parseFile(req, res, (error) => {
      if (error instanceof AppError) return next(error);
      if (error?.code === 'LIMIT_FILE_SIZE') return next(new AppError('FILE_TOO_LARGE'));
      if (['LIMIT_UNEXPECTED_FILE', 'LIMIT_FILE_COUNT'].includes(error?.code)) {
        return next(new AppError('INVALID_FILE_FIELD'));
      }
      if (error || Object.keys(req.body ?? {}).some((field) => !allowedFields.includes(field))) {
        return next(new AppError('INVALID_MULTIPART'));
      }
      next();
    });
  };
}

module.exports = {
  FILE_FIELD,
  MAX_FILE_SIZE,
  SUPPORTED_FILES,
  DOCUMENT_DESTINATIONS,
  userDocumentUpload: receiveFile(['documentType']),
  deliveryProofUpload: receiveFile([]),
};
