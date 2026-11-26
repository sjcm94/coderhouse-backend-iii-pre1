const { expect } = require('chai');
const { api, expectError } = require('./helpers/api');
const requestInProduction = require('./helpers/production');

describe('Performance y preparación para producción', () => {
  it('pagina 60 usuarios y devuelve solo los cinco solicitados de la segunda página', async () => {
    await api.post('/api/mocks/seed').query({ qty: 60 }).expect(201);
    const first = await api.get('/api/users').expect(200);
    const next = await api.get('/api/users').query({ page: 2 }).expect(200);
    const full = await api.get('/api/users').query({ limit: 60 }).expect(200);
    const secondPageOfFive = await api.get('/api/users').query({ page: 2, limit: 5 }).expect(200);

    expect(first.body).to.have.lengthOf(20);
    expect(full.body).to.have.lengthOf(60);
    expect(next.body).to.deep.equal(full.body.slice(20, 40));
    expect(secondPageOfFive.body).to.deep.equal(full.body.slice(5, 10));
  });

  it('pagina pedidos y entregas después de filtrar el estado', async () => {
    await api.post('/api/mocks/seed').query({ qty: 9, collection: 'all' }).expect(201);
    for (const resource of ['orders', 'deliveries']) {
      const route = `/api/${resource}`;
      const complete = await api.get(route).query({ status: 'PENDING' }).expect(200);
      const second = await api.get(route).query({ status: 'PENDING', page: 2, limit: 1 }).expect(200);

      expect(complete.body).to.have.lengthOf(3);
      expect(complete.body.every(({ status }) => status === 'PENDING')).to.equal(true);
      expect(second.body).to.deep.equal([complete.body[1]]);
    }
  });

  it('filtra el catálogo por stock antes de paginar', async () => {
    for (const [name, stock] of [['A', 0], ['B', 3], ['C', 1]]) {
      await api.post('/api/products').send({ name, stock, price: 2 }).expect(201);
    }
    const first = await api.get('/api/products?limit=1').expect(200);
    const second = await api.get('/api/products?limit=1&page=2').expect(200);
    expect(first.body.map(({ name }) => name)).to.deep.equal(['B']);
    expect(second.body.map(({ name }) => name)).to.deep.equal(['C']);
  });

  it('rechaza límites grandes, páginas inválidas y parámetros repetidos', async () => {
    for (const route of [
      '/api/users?limit=0', '/api/users?limit=1000', '/api/orders?page=0', '/api/deliveries?page=1001',
      '/api/products?limit=1&limit=2',
    ]) {
      const response = await api.get(route).expect(400);
      expectError(response, 'INVALID_PAGINATION', 'page debe ser un entero entre 1 y 1000 y limit entre 1 y 100.');
    }
  });

  it('publica un health check sin información privada', async () => {
    const result = await api.get('/api/health').expect(200);
    expect(result.body).to.have.all.keys('status', 'environment', 'uptime', 'timestamp');
    expect(result.body.status).to.equal('ok');
    expect(result.body.environment).to.equal('test');
    expect(Number.isInteger(result.body.uptime)).to.equal(true);
    expect(result.body.uptime).to.be.at.least(0);
    expect(new Date(result.body.timestamp).toISOString()).to.equal(result.body.timestamp);
  });

  it('documenta el health check y los límites de paginación en Swagger', async () => {
    const { body } = await api.get('/api/docs/openapi.json').expect(200);
    expect(body.paths['/api/health'].get.responses['200'].content['application/json'].schema.$ref)
      .to.equal('#/components/schemas/HealthResponse');

    for (const resource of ['users', 'products', 'orders', 'deliveries']) {
      const { parameters, responses } = body.paths[`/api/${resource}`].get;
      expect(parameters.find(({ name }) => name === 'page').schema).to.include({ default: 1, maximum: 1000 });
      expect(parameters.find(({ name }) => name === 'limit').schema).to.include({ default: 20, maximum: 100 });
      expect(responses['400'].content['application/json'].examples).to.have.property('INVALID_PAGINATION');
    }
  });

  it('restringe los GET de mocks y Swagger en producción por defecto', async () => {
    for (const route of ['/api/mocks', '/api/mocks/users', '/api/docs/', '/api/docs/openapi.json']) {
      const response = await requestInProduction('get', route);
      expect(response.status).to.equal(404);
      expectError(response, 'ROUTE_NOT_FOUND', 'La ruta solicitada no existe.');
    }

    const response = await requestInProduction('get', '/api/docs/openapi.json', 'true');
    expect(response.status).to.equal(200);
    expect(response.body.info.title).to.equal('ShipNow API');
    expect(response.body.paths).to.include.key('/api/health');
  });
});
