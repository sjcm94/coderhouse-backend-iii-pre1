const { Router } = require('express');
const swaggerUi = require('swagger-ui-express');
const specification = require('../config/swagger');
const { notFound } = require('../middlewares/error.middleware');

const router = Router();

router.use((req, res, next) => {
  if (!require('../config').swaggerEnabled) return notFound(req, res, next);
  next();
});

router.get('/openapi.json', (req, res) => res.json(specification));
router.use(swaggerUi.serve);
router.get('/', swaggerUi.setup(specification, { swaggerOptions: { validatorUrl: null } }));

module.exports = router;
