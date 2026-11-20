const deliveryService = require('../services/delivery.service');

async function getAll(req, res) {
  res.status(200).json(await deliveryService.getAll(req.query.status));
}

async function getById(req, res) {
  res.status(200).json(await deliveryService.getById(req.params.id));
}

module.exports = { getAll, getById };
