const { expect } = require('chai');
const { api, expectError, missingId } = require('./helpers/api');

describe('Swagger', () => {
  it('abre la documentación interactiva y sirve su script de inicio', async () => {
    const response = await api.get('/api/docs/').expect('Content-Type', /html/).expect(200);
    expect(response.text).to.include('Swagger UI');
    expect(response.text).to.include('swagger-ui-bundle.js');

    const script = await api.get('/api/docs/swagger-ui-init.js').expect(200);
    expect(script.text).to.include('ShipNow API');
  });

  it('publica los grupos, schemas y el cuerpo para crear un pedido', async () => {
    const response = await api.get('/api/docs/openapi.json').expect('Content-Type', /json/).expect(200);
    const spec = response.body;

    expect(spec.openapi).to.equal('3.0.3');
    expect(spec.info.title).to.equal('ShipNow API');
    expect(spec.tags.map(({ name }) => name)).to.include.members(
      ['Users', 'Orders', 'Deliveries', 'Mocks', 'Logger', 'Products'],
    );
    expect(spec.components.schemas).to.include.keys('User', 'Order', 'OrderItem', 'Delivery', 'ErrorResponse');
    const create = spec.paths['/api/orders'].post;
    expect(create.requestBody.content['application/json'].schema.$ref).to.equal('#/components/schemas/NewOrder');
    expect(create.responses).to.include.keys('201', '400', '404');

    const order = await api.get(`/api/orders/${missingId}`).expect(404);
    const documented = spec.paths['/api/orders/{id}'].get.responses['404'];
    expect(order.body).to.deep.equal(documented.content['application/json'].examples.ORDER_NOT_FOUND.value);
  });

  it('devuelve el formato común al solicitar una ruta de documentación inexistente', async () => {
    const response = await api.get('/api/docs/no-existe').expect('Content-Type', /json/).expect(404);
    expectError(response, 'ROUTE_NOT_FOUND', 'La ruta solicitada no existe.');
  });
});
