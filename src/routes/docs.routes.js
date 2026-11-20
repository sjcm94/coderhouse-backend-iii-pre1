const { Router } = require('express');
const swaggerUi = require('swagger-ui-express');
const specification = require('../config/swagger');

const router = Router();

router.get('/openapi.json', (req, res) => res.json(specification));
router.use(swaggerUi.serve);
router.get('/', swaggerUi.setup(specification, { swaggerOptions: { validatorUrl: null } }));

module.exports = router;
