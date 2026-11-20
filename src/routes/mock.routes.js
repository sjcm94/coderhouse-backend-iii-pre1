const { Router } = require('express');
const mockController = require('../controllers/mock.controller');

const router = Router();

router.get('/', mockController.previewBatch);
router.get('/users', mockController.previewUsers);
router.post('/seed', mockController.seed);

module.exports = router;
