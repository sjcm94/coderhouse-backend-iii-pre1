const { Router } = require('express');
const loggerController = require('../controllers/logger.controller');

const router = Router();

router.get('/test', loggerController.testLogger);

module.exports = router;
