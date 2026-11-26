const {
  USER_ROLES, PRODUCT_STATUS, ORDER_STATUS, ORDER_PRIORITY, DELIVERY_STATUS, DOCUMENT_TYPE,
} = require('../../constants');

const text = { type: 'string' };
const email = { type: 'string', format: 'email', example: 'ana@example.com' };
const id = { type: 'string', pattern: '^[a-fA-F0-9]{24}$', example: '507f1f77bcf86cd799439011' };
const values = (options) => ({ type: 'string', enum: Object.values(options) });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (name) => ({ type: 'array', items: ref(name) });
const name = { type: 'string', minLength: 1, example: 'Ana Pérez' };
const price = { type: 'number', minimum: 0, example: 12.5 };
const stock = { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER, example: 3 };

const schemas = {
  User: {
    type: 'object',
    required: ['_id', 'name', 'email', 'role'],
    properties: { _id: id, name, email, role: values(USER_ROLES) },
  },
  NewUser: {
    type: 'object',
    required: ['name', 'email'],
    properties: { name, email },
  },
  Product: {
    type: 'object',
    required: ['_id', 'name', 'price', 'stock', 'status'],
    properties: { _id: id, name, price, stock, status: values(PRODUCT_STATUS) },
  },
  NewProduct: {
    type: 'object',
    required: ['name', 'price', 'stock'],
    properties: { name: { ...name, example: 'Caja mediana' }, price, stock },
  },
  OrderItem: {
    type: 'object',
    required: ['name', 'quantity'],
    properties: {
      name: { ...name, example: 'Caja de prueba' },
      quantity: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER, example: 1 },
    },
  },
  NewOrder: {
    type: 'object',
    required: ['userId', 'items'],
    properties: {
      userId: id,
      priority: { ...values(ORDER_PRIORITY), default: ORDER_PRIORITY.NORMAL },
      items: { ...arrayOf('OrderItem'), minItems: 1 },
    },
  },
  Order: {
    type: 'object',
    required: ['_id', 'userId', 'status', 'priority'],
    properties: {
      _id: id,
      userId: id,
      status: values(ORDER_STATUS),
      priority: values(ORDER_PRIORITY),
      items: arrayOf('OrderItem'),
    },
  },
  Delivery: {
    type: 'object',
    required: ['_id', 'orderId', 'status'],
    properties: {
      _id: id,
      orderId: id,
      driverId: { ...id, nullable: true },
      status: values(DELIVERY_STATUS),
    },
  },
  FileMetadata: {
    type: 'object',
    required: ['originalName', 'filename', 'path', 'mimeType', 'size', 'documentType', 'uploadedAt'],
    properties: {
      originalName: { type: 'string', example: 'comprobante.pdf' },
      filename: { type: 'string', example: '019756e5-ddd8-4695-a98d-908277e4acd5.pdf' },
      path: { type: 'string', example: 'uploads/delivery-proofs/019756e5-ddd8-4695-a98d-908277e4acd5.pdf' },
      mimeType: { type: 'string', enum: ['application/pdf', 'image/jpeg', 'image/png'] },
      size: { type: 'integer', minimum: 1, maximum: 2097152 },
      documentType: values(DOCUMENT_TYPE),
      uploadedAt: { type: 'string', format: 'date-time' },
    },
  },
  UserDocumentResponse: {
    type: 'object',
    required: ['user'],
    properties: {
      user: {
        allOf: [
          ref('User'),
          { type: 'object', required: ['documents'], properties: { documents: arrayOf('FileMetadata') } },
        ],
      },
    },
  },
  DeliveryProofResponse: {
    type: 'object',
    required: ['delivery'],
    properties: {
      delivery: {
        allOf: [
          ref('Delivery'),
          { type: 'object', required: ['proofs'], properties: { proofs: arrayOf('FileMetadata') } },
        ],
      },
    },
  },
  HealthResponse: {
    type: 'object',
    required: ['status', 'environment', 'uptime', 'timestamp'],
    properties: {
      status: { type: 'string', enum: ['ok'] },
      environment: { type: 'string', enum: ['development', 'test', 'production'] },
      uptime: { type: 'integer', minimum: 0, description: 'Segundos de actividad del proceso.' },
      timestamp: { type: 'string', format: 'date-time' },
    },
  },
  ErrorResponse: {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: { code: text, message: text },
      },
    },
  },
  SuccessResponse: {
    type: 'object',
    required: ['message'],
    properties: { message: text },
  },
  MockUser: {
    type: 'object',
    required: ['nombre', 'email', 'rol'],
    properties: { nombre: name, email, rol: { type: 'string', enum: ['cliente', 'repartidor'] } },
  },
  MockBatch: {
    type: 'object',
    required: ['users', 'drivers', 'orders', 'deliveries'],
    properties: {
      users: arrayOf('User'),
      drivers: arrayOf('User'),
      orders: arrayOf('Order'),
      deliveries: arrayOf('Delivery'),
    },
  },
  SeedResponse: {
    type: 'object',
    required: ['insertados', 'coleccion'],
    properties: {
      insertados: { type: 'integer', minimum: 1, example: 10 },
      coleccion: { type: 'string', enum: ['usuarios', 'todas'], example: 'usuarios' },
    },
  },
  LoggerResponse: {
    allOf: [
      ref('SuccessResponse'),
      {
        type: 'object',
        required: ['niveles'],
        properties: {
          niveles: {
            type: 'array',
            items: { type: 'string', enum: ['debug', 'http', 'info', 'warning', 'error', 'fatal'] },
          },
        },
      },
    ],
  },
};

module.exports = { schemas, ref, arrayOf, id, values };
