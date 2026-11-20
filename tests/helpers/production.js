const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const path = require('node:path');

const runNode = promisify(execFile);
const root = path.join(__dirname, '../..');

async function requestInProduction(method, route) {
  const script = `
    const { logger } = require('./src/config/logger');
    logger.silent = true;
    const app = require('./src/app');
    const api = require('supertest')(app);
    const [method, route] = process.argv.slice(1);
    api[method](route).then(({ status, body }) => {
      process.stdout.write(JSON.stringify({ status, body }));
    }).catch((error) => {
      process.stderr.write(error.message);
      process.exitCode = 1;
    });
  `;
  const { stdout } = await runNode(process.execPath, ['-e', script, method, route], {
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production' },
    timeout: 5000,
  });
  return JSON.parse(stdout);
}

module.exports = requestInProduction;
