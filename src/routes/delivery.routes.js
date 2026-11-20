const { Router } = require('express');
const { deliveryProofUpload } = require('../config/upload.config');
const deliveryController = require('../controllers/delivery.controller');

const router = Router();

router.get('/', deliveryController.getAll);
router.get('/:id', deliveryController.getById);

router.post('/:id/proofs', deliveryProofUpload, deliveryController.uploadFile);

module.exports = router;
