const { expect } = require('chai');
const { api, expectError } = require('./helpers/api');
const requestInProduction = require('./helpers/production');

describe('Logger', () => {
  it('responde con los seis niveles registrados en test', async () => {
    const response = await api.get('/api/logger/test').expect(200);
    expect(response.body).to.deep.equal({
      message: 'Prueba del logger registrada.',
      niveles: ['debug', 'http', 'info', 'warning', 'error', 'fatal'],
    });
  });

  it('devuelve el error establecido para la misma ruta en producción', async () => {
    const response = await requestInProduction('get', '/api/logger/test');
    expect(response.status).to.equal(404);
    expectError(response, 'ROUTE_NOT_FOUND', 'La ruta solicitada no existe.');
  });
});
