const AppError = require('../errors/app.error');
const productRepository = require('../repositories/product.repository');
const { PRODUCT_STATUS } = require('../utils/constants');

async function getAll() {
  const products = await productRepository.getAll();
  return products.filter((product) => product.stock > 0);
}

async function create(data = {}) {
  const { name, price, stock } = data ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    throw new AppError('INVALID_PRODUCT_NAME');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new AppError('INVALID_PRODUCT_PRICE');
  }

  if (!Number.isSafeInteger(stock) || stock < 0) {
    throw new AppError('INVALID_PRODUCT_STOCK');
  }

  const status = stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
  return productRepository.create({ name: name.trim(), price, stock, status });
}

module.exports = { getAll, create };
