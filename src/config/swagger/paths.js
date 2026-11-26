const errors = require('../../errors/dictionary');
const { ORDER_STATUS, DELIVERY_STATUS, DOCUMENT_TYPE } = require('../../constants');
const { ref, arrayOf, id, values } = require('./schemas');
const { DEFAULT_LIMIT, MAX_LIMIT, MAX_PAGE } = require('../../services/pagination');
const { FILE_FIELD, SUPPORTED_FILES } = require('../upload.config');

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

function uploadBody(properties = {}) {
  return {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          required: [FILE_FIELD, ...Object.keys(properties)],
          properties: {
            [FILE_FIELD]: { type: 'string', format: 'binary', description: 'PDF, JPEG o PNG de hasta 2 MiB.' },
            ...properties,
          },
        },
        encoding: {
          [FILE_FIELD]: { contentType: Object.keys(SUPPORTED_FILES).join(', ') },
        },
      },
    },
  };
}

function statusParameter(statuses) {
  return [{
    name: 'status',
    in: 'query',
    description: 'Filtra por estado. Omítelo para listar todos los registros.',
    schema: values(statuses),
  }];
}

const pageParameters = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: MAX_PAGE, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT } },
];
const invalidPagination = errorResponse('Paginación inválida.', 'INVALID_PAGINATION');
const privateRoute = errorResponse('Ruta interna deshabilitada en producción.', 'ROUTE_NOT_FOUND');

const idParameter = [{ name: 'id', in: 'path', required: true, schema: id }];
const quantity = {
  name: 'qty',
  in: 'query',
  description: 'Cantidad entera. En un lote completo se aplica a cada tipo de registro.',
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
};
const invalidQuantity = errorResponse('Cantidad inválida.', 'INVALID_MOCK_QUANTITY');
const internalError = errorResponse('Falla inesperada del servidor.', 'INTERNAL_ERROR');
const invalidId = errorResponse('ID con formato inválido.', 'INVALID_ID');
const bodyErrors = {
  413: errorResponse('El cuerpo supera el tamaño permitido.', 'BODY_TOO_LARGE'),
  415: errorResponse('Codificación de cuerpo no compatible.', 'UNSUPPORTED_BODY_ENCODING'),
};

const uploadErrors = {
  413: errorResponse('El archivo o el cuerpo supera el tamaño permitido.', 'FILE_TOO_LARGE', 'BODY_TOO_LARGE'),
  415: errorResponse('Tipo de archivo o codificación no permitidos.', 'INVALID_FILE_TYPE', 'UNSUPPORTED_BODY_ENCODING'),
  500: errorResponse('Fallo al guardar y asociar el archivo o error inesperado.', 'FILE_SAVE_FAILED', 'INTERNAL_ERROR'),
};

module.exports = {
  '/api/health': {
    get: {
      tags: ['Health'],
      summary: 'Consultar si el proceso de la API responde',
      description: 'Indica estado, entorno, segundos de actividad y fecha del servidor.',
      responses: { 200: success('La API está activa.', ref('HealthResponse')) },
    },
  },
  '/api/users': {
    get: {
      tags: ['Users'],
      summary: 'Listar usuarios registrados',
      parameters: pageParameters,
      responses: {
        200: success('Lista de usuarios.', arrayOf('User')),
        400: invalidPagination,
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
  '/api/users/{id}/documents': {
    post: {
      tags: ['Users'],
      summary: 'Subir un documento de usuario',
      description: 'Guarda un PDF, JPEG o PNG y agrega sus metadatos al usuario.',
      parameters: idParameter,
      requestBody: uploadBody({
        documentType: { type: 'string', enum: [DOCUMENT_TYPE.IDENTITY, DOCUMENT_TYPE.LICENSE] },
      }),
      responses: {
        201: success('Usuario actualizado con los documentos asociados.', ref('UserDocumentResponse')),
        400: errorResponse(
          'ID, archivo o formulario inválido.',
          'INVALID_ID', 'FILE_REQUIRED', 'INVALID_FILE_FIELD', 'INVALID_MULTIPART', 'INVALID_DOCUMENT_TYPE', 'INVALID_JSON',
        ),
        404: errorResponse('Usuario inexistente.', 'USER_NOT_FOUND'),
        ...uploadErrors,
      },
    },
  },
  '/api/products': {
    get: {
      tags: ['Products'],
      summary: 'Listar productos con stock',
      parameters: pageParameters,
      responses: {
        200: success('Lista de productos disponibles.', arrayOf('Product')),
        400: invalidPagination,
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
      parameters: [...statusParameter(ORDER_STATUS), ...pageParameters],
      responses: {
        200: success('Lista de pedidos.', arrayOf('Order')),
        400: errorResponse('Estado o paginación inválidos.', 'INVALID_STATUS', 'INVALID_PAGINATION'),
        500: internalError,
      },
    },
    post: {
      tags: ['Orders'],
      summary: 'Crear un pedido',
      description: 'Usa el ID de un cliente existente con rol USER. El pedido se crea con estado PENDING.',
      requestBody: jsonBody('NewOrder'),
      responses: {
        201: success('Pedido creado.', ref('Order')),
        400: errorResponse(
          'ID, cliente, prioridad, items o JSON inválido.',
          'INVALID_ID', 'INVALID_ORDER_USER', 'INVALID_ORDER_PRIORITY', 'INVALID_ORDER_ITEMS', 'INVALID_JSON',
        ),
        404: errorResponse('Cliente inexistente.', 'USER_NOT_FOUND'),
        ...bodyErrors,
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
      parameters: [...statusParameter(DELIVERY_STATUS), ...pageParameters],
      responses: {
        200: success('Lista de entregas.', arrayOf('Delivery')),
        400: errorResponse('Estado o paginación inválidos.', 'INVALID_STATUS', 'INVALID_PAGINATION'),
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
  '/api/deliveries/{id}/proofs': {
    post: {
      tags: ['Deliveries'],
      summary: 'Subir un comprobante de entrega',
      description: 'Guarda el archivo y asocia sus metadatos con el tipo DELIVERY_PROOF.',
      parameters: idParameter,
      requestBody: uploadBody(),
      responses: {
        201: success('Entrega actualizada con los comprobantes asociados.', ref('DeliveryProofResponse')),
        400: errorResponse(
          'ID, archivo o formulario inválido.',
          'INVALID_ID', 'FILE_REQUIRED', 'INVALID_FILE_FIELD', 'INVALID_MULTIPART', 'INVALID_JSON',
        ),
        404: errorResponse('Entrega inexistente.', 'DELIVERY_NOT_FOUND'),
        ...uploadErrors,
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
        404: privateRoute,
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
        404: privateRoute,
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
