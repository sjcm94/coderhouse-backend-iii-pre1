const { expect } = require('chai');
const { api, expectError, missingId, objectId } = require('./helpers/api');

describe('Entregas', () => {
  it('lista y obtiene por ID una entrega pendiente', async () => {
    await api.post('/api/mocks/seed').query({ qty: 3, collection: 'all' }).expect(201);
    const response = await api.get('/api/deliveries').query({ status: 'PENDING' }).expect(200);

    expect(response.body).to.have.lengthOf(1);
    const [delivery] = response.body;
    expect(delivery).to.have.all.keys('_id', 'orderId', 'driverId', 'status');
    expect(delivery._id).to.match(objectId);
    expect(delivery.orderId).to.match(objectId);
    expect(delivery.driverId).to.equal(null);
    expect(delivery.status).to.equal('PENDING');

    const detail = await api.get(`/api/deliveries/${delivery._id}`).expect(200);
    expect(detail.body).to.deep.equal(delivery);
  });

  it('rechaza un estado de entrega inválido', async () => {
    const response = await api.get('/api/deliveries').query({ status: 'INVALIDO' }).expect(400);
    expectError(response, 'INVALID_STATUS', 'El estado indicado no está permitido.');
  });

  it('devuelve 404 para una entrega inexistente', async () => {
    const response = await api.get(`/api/deliveries/${missingId}`).expect(404);
    expectError(response, 'DELIVERY_NOT_FOUND', 'La entrega no existe.');
  });
});
