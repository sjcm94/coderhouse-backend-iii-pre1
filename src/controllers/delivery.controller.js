const deliveryService = require('../services/delivery.service');

async function getAll(req, res) {
  res.status(200).json(await deliveryService.getAll(req.query.status));
}

async function getById(req, res) {
  res.status(200).json(await deliveryService.getById(req.params.id));
}

async function uploadFile(req, res) {
  const updated = await deliveryService.uploadFile(req.params.id, req.file);
  res.status(201).json({ delivery: updated });
}

module.exports = { uploadFile, getAll, getById };
