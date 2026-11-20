const { expect } = require('chai');
const { api, expectError, createCustomer, objectId } = require('./helpers/api');

describe('Usuarios', () => {
  it('lista los usuarios registrados con sus campos públicos', async () => {
    const customer = await createCustomer();
    const response = await api.get('/api/users').expect('Content-Type', /json/).expect(200);

    expect(customer._id).to.match(objectId);
    expect(response.body).to.deep.equal([
      { _id: customer._id, name: 'Ana Pérez', email: 'ana@example.com', role: 'USER' },
    ]);
  });

  it('devuelve una lista vacía sin datos cargados', async () => {
    const response = await api.get('/api/users').expect(200);
    expect(response.body).to.deep.equal([]);
  });

  it('rechaza un correo inválido al crear un usuario', async () => {
    const response = await api.post('/api/users').send({ name: 'Ana', email: 'sin-arroba' }).expect(400);
    expectError(response, 'INVALID_EMAIL', 'El correo electrónico no es válido.');
  });

  it('rechaza un correo duplicado', async () => {
    await createCustomer();
    const response = await api.post('/api/users').send({ name: 'Ana', email: 'ana@example.com' }).expect(409);
    expectError(response, 'EMAIL_ALREADY_EXISTS', 'El correo electrónico ya está registrado.');
  });
});
