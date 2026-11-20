const { Router } = require('express');
const orderController = require('../controllers/order.controller');

const router = Router();

router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);

module.exports = router;
