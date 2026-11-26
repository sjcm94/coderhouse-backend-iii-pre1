const orderService = require('../services/order.service');

async function getAll(req, res) {
  res.status(200).json(await orderService.getAll(req.query));
}

async function getById(req, res) {
  res.status(200).json(await orderService.getById(req.params.id));
}

async function create(req, res) {
  res.status(201).json(await orderService.create(req.body));
}

module.exports = { getAll, getById, create };
