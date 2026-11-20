const errors = require('../../errors/dictionary');
const { ORDER_STATUS, DELIVERY_STATUS } = require('../../constants');
const { ref, arrayOf, id, values } = require('./schemas');

function success(description, schema) {
  return { description, content: { 'application/json': { schema } } };
}

function errorResponse(description, ...codes) {
  const examples = {};
  for (const code of codes) {
    examples[code] = { value: { error: { code, message: errors[code].message } } };
  }

  return {
    description,
    content: { 'application/json': { schema: ref('ErrorResponse'), examples } },
  };
}

function jsonBody(schema) {
  return { required: true, content: { 'application/json': { schema: ref(schema) } } };
}

function statusParameter(statuses) {
  return [{
    name: 'status',
    in: 'query',
    description: 'Filtra por estado. Omítelo para listar todos los registros.',
    schema: values(statuses),
  }];
}

const idParameter = [{ name: 'id', in: 'path', required: true, schema: id }];
const quantity = {
  name: 'qty',
  in: 'query',
  description: 'Cantidad entera. En un lote completo se aplica a cada tipo de registro.',
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
};
const invalidQuantity = errorResponse('Cantidad inválida.', 'INVALID_MOCK_QUANTITY');
const internalError = errorResponse('Falla inesperada del servidor.', 'INTERNAL_ERROR');
const invalidStatus = errorResponse('Estado no permitido.', 'INVALID_STATUS');
const invalidId = errorResponse('ID con formato inválido.', 'INVALID_ID');
const bodyErrors = {
  413: errorResponse('El cuerpo supera el tamaño permitido.', 'BODY_TOO_LARGE'),
  415: errorResponse('Codificación de cuerpo no compatible.', 'UNSUPPORTED_BODY_ENCODING'),
};

module.exports = {
  '/api/users': {
    get: {
      tags: ['Users'],
      summary: 'Listar usuarios registrados',
      responses: {
        200: success('Lista de usuarios.', arrayOf('User')),
        500: internalError,
      },
    },
    post: {
      tags: ['Users'],
      summary: 'Crear un usuario',
      description: 'La API asigna el rol USER al usuario nuevo.',
      requestBody: jsonBody('NewUser'),
      responses: {
        201: success('Usuario creado.', ref('User')),
        400: errorResponse('Nombre, correo o JSON inválido.', 'INVALID_USER_NAME', 'INVALID_EMAIL', 'INVALID_JSON'),
        409: errorResponse('El correo ya está registrado.', 'EMAIL_ALREADY_EXISTS'),
        ...bodyErrors,
        500: internalError,
      },
    },
  },
  '/api/products': {
    get: {
      tags: ['Products'],
      summary: 'Listar productos con stock',
      responses: {
        200: success('Lista de productos disponibles.', arrayOf('Product')),
        500: internalError,
      },
    },
    post: {
      tags: ['Products'],
      summary: 'Crear un producto',
      description: 'El estado se calcula a partir del stock enviado.',
      requestBody: jsonBody('NewProduct'),
      responses: {
        201: success('Producto creado.', ref('Product')),
        400: errorResponse('Nombre, precio, stock o JSON inválido.', 'INVALID_PRODUCT_NAME', 'INVALID_PRODUCT_PRICE', 'INVALID_PRODUCT_STOCK', 'INVALID_JSON'),
        ...bodyErrors,
        500: internalError,
      },
    },
  },
  '/api/orders': {
    get: {
      tags: ['Orders'],
      summary: 'Listar pedidos guardados',
      parameters: statusParameter(ORDER_STATUS),
      responses: {
        200: success('Lista de pedidos.', arrayOf('Order')),
        400: invalidStatus,
        500: internalError,
      },
    },
  },
  '/api/orders/{id}': {
    get: {
      tags: ['Orders'],
      summary: 'Consultar un pedido por ID',
      parameters: idParameter,
      responses: {
        200: success('Pedido encontrado.', ref('Order')),
        400: invalidId,
        404: errorResponse('Pedido inexistente.', 'ORDER_NOT_FOUND'),
        500: internalError,
      },
    },
  },
  '/api/deliveries': {
    get: {
      tags: ['Deliveries'],
      summary: 'Listar entregas guardadas',
      parameters: statusParameter(DELIVERY_STATUS),
      responses: {
        200: success('Lista de entregas.', arrayOf('Delivery')),
        400: invalidStatus,
        500: internalError,
      },
    },
  },
  '/api/deliveries/{id}': {
    get: {
      tags: ['Deliveries'],
      summary: 'Consultar una entrega por ID',
      parameters: idParameter,
      responses: {
        200: success('Entrega encontrada.', ref('Delivery')),
        400: invalidId,
        404: errorResponse('Entrega inexistente.', 'DELIVERY_NOT_FOUND'),
        500: internalError,
      },
    },
  },
  '/api/mocks/users': {
    get: {
      tags: ['Mocks'],
      summary: 'Generar usuarios de prueba',
      description: 'Devuelve clientes y repartidores simulados sin guardarlos.',
      parameters: [quantity],
      responses: {
        200: success('Usuarios generados.', arrayOf('MockUser')),
        400: invalidQuantity,
        500: internalError,
      },
    },
  },
  '/api/mocks': {
    get: {
      tags: ['Mocks'],
      summary: 'Generar usuarios, repartidores, pedidos y entregas de prueba',
      description: 'Devuelve un lote relacionado sin guardarlo en MongoDB.',
      parameters: [quantity],
      responses: {
        200: success('Lote generado.', ref('MockBatch')),
        400: invalidQuantity,
        500: internalError,
      },
    },
  },
  '/api/mocks/seed': {
    post: {
      tags: ['Mocks'],
      summary: 'Insertar datos de prueba en MongoDB',
      description: 'Envía qty y collection en la URL. Deja el cuerpo vacío. Con collection=all se guardan cuatro tipos de registros y qty se aplica a cada uno.',
      parameters: [
        quantity,
        {
          name: 'collection',
          in: 'query',
          description: 'users guarda usuarios y repartidores. all incluye pedidos y entregas.',
          schema: { type: 'string', enum: ['users', 'all'], default: 'users' },
        },
      ],
      responses: {
        201: success('Lote guardado.', ref('SeedResponse')),
        400: errorResponse('Cantidad, colección o JSON inválido.', 'INVALID_MOCK_QUANTITY', 'INVALID_MOCK_COLLECTION', 'INVALID_JSON'),
        403: errorResponse('Carga prohibida en producción.', 'MOCK_SEED_FORBIDDEN'),
        ...bodyErrors,
        500: errorResponse('Falla durante la carga o error inesperado.', 'MOCK_SEED_FAILED', 'INTERNAL_ERROR'),
      },
    },
  },
  '/api/logger/test': {
    get: {
      tags: ['Logger'],
      summary: 'Probar los seis niveles de logging',
      description: 'Herramienta de validación habilitada en desarrollo y pruebas. Genera mensajes de ejemplo para revisar la consola y el archivo de logs.',
      responses: {
        200: success('Prueba registrada.', ref('LoggerResponse')),
        404: errorResponse('Ruta deshabilitada en producción.', 'ROUTE_NOT_FOUND'),
        500: internalError,
      },
    },
  },
};
