const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');

const api = request(app);
const missingId = '507f1f77bcf86cd799439011';
const objectId = /^[a-f0-9]{24}$/;

function expectError(response, code, message) {
  expect(response.body).to.deep.equal({ error: { code, message } });
}

async function createCustomer() {
  const response = await api.post('/api/users')
    .send({ name: 'Ana Pérez', email: 'ana@example.com' })
    .expect(201);
  return response.body;
}

module.exports = { api, expectError, createCustomer, missingId, objectId };
