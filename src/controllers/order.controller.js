const orderService = require('../services/order.service');

async function getAll(req, res) {
  res.status(200).json(await orderService.getAll(req.query.status));
}

async function getById(req, res) {
  res.status(200).json(await orderService.getById(req.params.id));
}

module.exports = { getAll, getById };
