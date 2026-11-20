const productService = require('../services/product.service');

async function getAll(req, res) {
  const products = await productService.getAll();
  res.status(200).json(products);
}

async function create(req, res) {
  const product = await productService.create(req.body);

  res.status(201).json(product);
}

module.exports = { getAll, create };
