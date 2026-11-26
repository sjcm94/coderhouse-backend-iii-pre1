function getHealth(req, res) {
  const { nodeEnv } = require('../config');

  res.status(200).json({
    status: 'ok',
    environment: nodeEnv,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
