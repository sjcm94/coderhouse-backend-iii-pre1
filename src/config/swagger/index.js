const { version } = require('../../../package.json');
const { schemas } = require('./schemas');
const paths = require('./paths');

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'ShipNow API',
    version,
    description: 'API de práctica para consultar productos, usuarios, pedidos y entregas. Incluye rutas para generar datos de prueba y comprobar los logs.',
  },
  servers: [
    { url: '/', description: 'Servidor donde se abrió Swagger UI' },
    { url: 'http://localhost:3000', description: 'Servidor local con el puerto del README' },
  ],
  tags: [
    { name: 'Users', description: 'Usuarios de ShipNow' },
    { name: 'Orders', description: 'Consultas de pedidos guardados' },
    { name: 'Deliveries', description: 'Consultas de entregas guardadas' },
    { name: 'Mocks', description: 'Generación y carga de datos de prueba' },
    { name: 'Logger', description: 'Validación de niveles de logging' },
    { name: 'Products', description: 'Catálogo de productos' },
    { name: 'Health', description: 'Estado del proceso de ShipNow' },
  ],
  paths,
  components: { schemas },
};
