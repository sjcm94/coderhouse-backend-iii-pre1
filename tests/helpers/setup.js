const { loadTestEnvironment } = require('../../src/config/test.config');
const { mongoUri, dbName } = loadTestEnvironment();

const mongoose = require('mongoose');
const database = require('../../src/repositories/database');
const User = require('../../src/models/user.model');
const Product = require('../../src/models/product.model');
const Order = require('../../src/models/order.model');
const Delivery = require('../../src/models/delivery.model');

exports.mochaHooks = {
  async beforeAll() {
    try {
      await database.connect(mongoUri, { dbName, serverSelectionTimeoutMS: 4000 });
    } catch (error) {
      throw new Error('MongoDB de pruebas no está disponible. Revisa TEST_MONGODB_URI.', { cause: error });
    }
  },

  async beforeEach() {
    await Promise.all([
      Delivery.deleteMany({}),
      Order.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({}),
    ]);
  },

  async afterAll() {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await database.disconnect();
    }
  },
};
