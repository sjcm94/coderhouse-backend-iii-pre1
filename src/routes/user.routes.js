const { Router } = require('express');
const { userDocumentUpload } = require('../config/upload.config');
const userController = require('../controllers/user.controller');

const router = Router();

router.get('/', userController.getAll);
router.post('/', userController.create);

router.post('/:id/documents', userDocumentUpload, userController.uploadFile);

module.exports = router;
