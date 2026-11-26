const { randomUUID } = require('node:crypto');
const path = require('node:path');
const { tmpdir } = require('node:os');
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

  const dbName = `shipnow_test_${randomUUID().replaceAll('-', '')}`;
  const uploadsDir = path.join(tmpdir(), dbName);

  process.env.PORT = '3000';
  process.env.MONGODB_URI = mongoUri;
  process.env.NODE_ENV = 'test';
  process.env.SWAGGER_ENABLED = 'true';
  process.env.LOG_LEVEL = 'debug';
  process.env.UPLOADS_DIR = uploadsDir;

  return { mongoUri, dbName, uploadsDir };
}

module.exports = { loadTestEnvironment };
