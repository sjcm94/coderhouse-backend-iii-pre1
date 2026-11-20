const { expect } = require('chai');
const Delivery = require('../src/models/delivery.model');
const { api, expectError, objectId } = require('./helpers/api');
const requestInProduction = require('./helpers/production');

describe('Mocks', () => {
  it('genera un cliente y un repartidor sin guardarlos', async () => {
    const response = await api.get('/api/mocks/users').query({ qty: 2 }).expect(200);

    expect(response.body).to.have.lengthOf(2);
    expect(response.body.map(({ rol }) => rol)).to.deep.equal(['cliente', 'repartidor']);
    for (const user of response.body) {
      expect(user).to.have.all.keys('nombre', 'email', 'rol');
      expect(user.nombre).to.be.a('string').and.not.empty;
      expect(user.email).to.match(/@example\.com$/);
    }

    const saved = await api.get('/api/users').expect(200);
    expect(saved.body).to.deep.equal([]);
  });

  it('genera un lote relacionado sin guardarlo', async () => {
    const response = await api.get('/api/mocks').query({ qty: 1 }).expect(200);
    const { users, drivers, orders, deliveries } = response.body;
    expect(response.body).to.have.all.keys('users', 'drivers', 'orders', 'deliveries');
    for (const group of [users, drivers, orders, deliveries]) {
      expect(group).to.have.lengthOf(1);
      expect(group[0]._id).to.match(objectId);
    }
    expect(users[0].role).to.equal('USER');
    expect(drivers[0].role).to.equal('DRIVER');
    expect(orders[0].userId).to.equal(users[0]._id);
    expect(deliveries[0].orderId).to.equal(orders[0]._id);
    expect(deliveries[0].driverId).to.equal(drivers[0]._id);

    const saved = await api.get('/api/orders').expect(200);
    expect(saved.body).to.deep.equal([]);
  });

  it('carga usuarios y repartidores en MongoDB', async () => {
    const response = await api.post('/api/mocks/seed').query({ qty: 2 }).expect(201);
    expect(response.body).to.deep.equal({ insertados: 2, coleccion: 'usuarios' });

    const saved = await api.get('/api/users').expect(200);
    expect(saved.body).to.have.lengthOf(2);
    expect(saved.body.map(({ role }) => role)).to.have.members(['USER', 'DRIVER']);
  });

  it('carga las cuatro entidades de un lote completo', async () => {
    const response = await api.post('/api/mocks/seed').query({ qty: 1, collection: 'all' }).expect(201);
    expect(response.body).to.deep.equal({ insertados: 4, coleccion: 'todas' });

    const users = await api.get('/api/users').expect(200);
    const orders = await api.get('/api/orders').expect(200);
    const deliveries = await api.get('/api/deliveries').expect(200);
    const customer = users.body.find((user) => user.role === 'USER');
    const driver = users.body.find((user) => user.role === 'DRIVER');
    expect(orders.body).to.have.lengthOf(1);
    expect(deliveries.body).to.have.lengthOf(1);
    expect(orders.body[0].userId).to.equal(customer._id);
    expect(deliveries.body[0].orderId).to.equal(orders.body[0]._id);
    expect(deliveries.body[0].driverId).to.equal(driver._id);
  });

  const invalidQuantities = [
    { method: 'get', path: '/api/mocks/users', qty: -1 },
    { method: 'get', path: '/api/mocks', qty: 101 },
    { method: 'post', path: '/api/mocks/seed', qty: 0 },
  ];

  for (const { method, path, qty } of invalidQuantities) {
    it(`rechaza qty=${qty} en ${method.toUpperCase()} ${path}`, async () => {
      const response = await api[method](path).query({ qty }).expect(400);
      expectError(response, 'INVALID_MOCK_QUANTITY', 'qty debe ser un número entero entre 1 y 100.');
    });
  }

  it('rechaza una colección inválida', async () => {
    const response = await api.post('/api/mocks/seed').query({ qty: 1, collection: 'orders' }).expect(400);
    expectError(response, 'INVALID_MOCK_COLLECTION', 'collection debe ser users o all.');
  });

  it('impide la carga en producción', async () => {
    const response = await requestInProduction('post', '/api/mocks/seed');
    expect(response.status).to.equal(403);
    expectError(response, 'MOCK_SEED_FORBIDDEN', 'La carga de datos de prueba está deshabilitada en producción.');
  });

  it('responde con el error previsto y limpia el lote si MongoDB rechaza una entrega', async () => {
    await Delivery.init();
    const collection = Delivery.collection.name;
    await Delivery.db.db.command({ collMod: collection, validator: { status: 'ESTADO_DE_PRUEBA' } });
    try {
      const response = await api.post('/api/mocks/seed').query({ qty: 1, collection: 'all' }).expect(500);
      expectError(response, 'MOCK_SEED_FAILED', 'No se pudo completar la carga de datos de prueba.');
      for (const resource of ['users', 'orders', 'deliveries']) {
        const list = await api.get(`/api/${resource}`).expect(200);
        expect(list.body).to.deep.equal([]);
      }
    } finally {
      await Delivery.db.db.command({ collMod: collection, validator: {} });
    }
  });
});
