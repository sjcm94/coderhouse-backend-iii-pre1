const { expect } = require('chai');
const { api, expectError, createCustomer, missingId, objectId } = require('./helpers/api');

const items = [{ name: 'Caja mediana', quantity: 2 }];

async function createOrder() {
  const customer = await createCustomer();
  const input = { userId: customer._id, items };
  const response = await api.post('/api/orders').send(input).expect(201);
  return { order: response.body, input };
}

describe('Pedidos', () => {
  it('crea un pedido PENDING y usa prioridad NORMAL por defecto', async () => {
    const { order, input } = await createOrder();

    expect(order._id).to.match(objectId);
    expect(order).to.deep.equal({
      _id: order._id,
      userId: input.userId,
      status: 'PENDING',
      priority: 'NORMAL',
      items,
    });
    const saved = await api.get(`/api/orders/${order._id}`).expect(200);
    expect(saved.body).to.deep.equal(order);
  });

  it('lista pedidos y permite filtrarlos por estado', async () => {
    const { order } = await createOrder();
    const list = await api.get('/api/orders').expect(200);
    const pending = await api.get('/api/orders').query({ status: 'PENDING' }).expect(200);
    const delivered = await api.get('/api/orders').query({ status: 'DELIVERED' }).expect(200);

    expect(list.body).to.deep.equal([order]);
    expect(pending.body).to.deep.equal([order]);
    expect(delivered.body).to.deep.equal([]);
  });

  it('consulta por ID un pedido guardado con sus items', async () => {
    const { order } = await createOrder();
    const response = await api.get(`/api/orders/${order._id}`).expect(200);
    expect(response.body).to.deep.equal(order);
    expect(response.body.items).to.deep.equal(items);
  });

  it('rechaza un pedido incompleto y no lo guarda', async () => {
    const customer = await createCustomer();
    const response = await api.post('/api/orders').send({ userId: customer._id }).expect(400);
    expectError(response, 'INVALID_ORDER_ITEMS', 'El pedido debe incluir items con nombre y cantidad entera positiva.');

    const list = await api.get('/api/orders').expect(200);
    expect(list.body).to.deep.equal([]);
  });

  it('rechaza una prioridad inválida', async () => {
    const customer = await createCustomer();
    const response = await api.post('/api/orders').send({ userId: customer._id, items, priority: 'URGENT' }).expect(400);
    expectError(response, 'INVALID_ORDER_PRIORITY', 'La prioridad del pedido no está permitida.');
  });

  it('responde 404 al crear un pedido para un cliente inexistente', async () => {
    const response = await api.post('/api/orders').send({ userId: missingId, items }).expect(404);
    expectError(response, 'USER_NOT_FOUND', 'El usuario no existe.');
  });

  it('responde 404 al consultar un pedido inexistente', async () => {
    const response = await api.get(`/api/orders/${missingId}`).expect(404);
    expectError(response, 'ORDER_NOT_FOUND', 'El pedido no existe.');
  });

  it('rechaza un ID de pedido con formato inválido', async () => {
    const response = await api.get('/api/orders/invalido').expect(400);
    expectError(response, 'INVALID_ID', 'El ID debe tener 24 caracteres hexadecimales.');
  });

  it('rechaza un estado de pedido inválido', async () => {
    const response = await api.get('/api/orders').query({ status: 'INVALIDO' }).expect(400);
    expectError(response, 'INVALID_STATUS', 'El estado indicado no está permitido.');
  });
});
