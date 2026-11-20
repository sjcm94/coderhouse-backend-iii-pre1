const mockService = require('../services/mock.service');

function previewUsers(req, res) {
  res.status(200).json(mockService.previewUsers(req.query.qty));
}

function previewBatch(req, res) {
  res.status(200).json(mockService.previewBatch(req.query.qty));
}

async function seed(req, res) {
  const result = await mockService.seed(req.query.qty, req.query.collection);
  res.status(201).json(result);
}

module.exports = { previewUsers, previewBatch, seed };
