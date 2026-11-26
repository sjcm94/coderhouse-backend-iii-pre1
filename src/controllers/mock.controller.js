const mockService = require('../services/mock.service');
const AppError = require('../errors/app.error');

function requireMockPreview() {
  if (require('../config').nodeEnv === 'production') throw new AppError('ROUTE_NOT_FOUND');
}

function previewUsers(req, res) {
  requireMockPreview();
  res.status(200).json(mockService.previewUsers(req.query.qty));
}

function previewBatch(req, res) {
  requireMockPreview();
  res.status(200).json(mockService.previewBatch(req.query.qty));
}

async function seed(req, res) {
  const result = await mockService.seed(req.query.qty, req.query.collection);
  res.status(201).json(result);
}

module.exports = { previewUsers, previewBatch, seed };
