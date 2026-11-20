const { randomUUID } = require('node:crypto');
const path = require('node:path');
const dotenv = require('dotenv');

function loadTestEnvironment() {
  const testFile = {};
  const result = dotenv.config({
    path: path.join(__dirname, '../../.env.test'),
    processEnv: testFile,
  });

  if (result.error && result.error.code !== 'ENOENT') throw result.error;

  const mongoUri = process.env.TEST_MONGODB_URI?.trim()
    || testFile.TEST_MONGODB_URI?.trim()
    || 'mongodb://127.0.0.1:27017';

  process.env.PORT = '3000';
  process.env.MONGODB_URI = mongoUri;
  process.env.NODE_ENV = 'test';

  return {
    mongoUri,
    dbName: `shipnow_test_${randomUUID().replaceAll('-', '')}`,
  };
}

module.exports = { loadTestEnvironment };
