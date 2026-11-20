const { expect } = require('chai');
const { api, expectError, objectId } = require('./helpers/api');

describe('Productos', () => {
  it('guarda un producto y muestra en el listado solo productos con stock', async () => {
    const input = { name: 'Caja', price: 8.5, stock: 2 };
    const available = await api.post('/api/products').send(input).expect(201);
    const empty = await api.post('/api/products').send({ ...input, stock: 0 }).expect(201);
    expect(available.body._id).to.match(objectId);
    expect(available.body).to.deep.equal({ _id: available.body._id, ...input, status: 'AVAILABLE' });
    expect(empty.body.status).to.equal('OUT_OF_STOCK');

    const list = await api.get('/api/products').expect(200);
    expect(list.body).to.deep.equal([available.body]);
  });

  it('devuelve un error de validación cuando el stock es negativo', async () => {
    const response = await api.post('/api/products').send({ name: 'Caja', price: 8.5, stock: -1 }).expect(400);
    expectError(response, 'INVALID_PRODUCT_STOCK', 'El stock debe ser un número entero mayor o igual a cero.');
  });
});
