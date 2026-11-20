const productRepository = require('../repositories/product.repository');
const { PRODUCT_STATUS } = require('../utils/constants');

async function getAll() {
  const products = await productRepository.getAll();
  return products.filter((product) => product.stock > 0);
}

async function create(data = {}) {
  const { name, price, stock } = data ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'El nombre del producto es obligatorio.' };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: 'El precio debe ser un número mayor o igual a cero.' };
  }

  if (!Number.isSafeInteger(stock) || stock < 0) {
    return { error: 'El stock debe ser un número entero mayor o igual a cero.' };
  }

  const status = stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
  return productRepository.create({ name: name.trim(), price, stock, status });
}

module.exports = { getAll, create };
