const { Router } = require('express');
const deliveryController = require('../controllers/delivery.controller');

const router = Router();

router.get('/', deliveryController.getAll);
router.get('/:id', deliveryController.getById);

module.exports = router;
