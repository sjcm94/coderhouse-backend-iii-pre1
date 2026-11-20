const { api, expectError } = require('./helpers/api');

describe('Errores HTTP', () => {
  it('devuelve un error JSON para una ruta inexistente', async () => {
    const response = await api.get('/api/no-existe').expect('Content-Type', /json/).expect(404);
    expectError(response, 'ROUTE_NOT_FOUND', 'La ruta solicitada no existe.');
  });

  it('devuelve el formato común si el cuerpo JSON es inválido', async () => {
    const response = await api.post('/api/orders').type('json').send('{').expect(400);
    expectError(response, 'INVALID_JSON', 'El cuerpo debe contener JSON válido.');
  });
});
