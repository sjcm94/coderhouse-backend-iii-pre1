const Product = require('../models/product.model');

const fields = '_id name price stock status';

function getAll({ skip, limit }) {
  return Product.find({ stock: { $gt: 0 } })
    .select(fields)
    .sort({ name: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

async function create(data) {
  const product = await Product.create(data);
  const { _id, name, price, stock, status } = product;
  return { _id, name, price, stock, status };
}

module.exports = { getAll, create };
