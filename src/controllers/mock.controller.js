const mockService = require('../services/mock.service');

const QUANTITY_ERROR = 'qty debe ser un número entero entre 1 y 100.';

function previewUsers(req, res) {
  const qty = mockService.readQuantity(req.query.qty);
  if (qty === null) return res.status(400).json({ error: QUANTITY_ERROR });

  res.json(mockService.previewUsers(qty));
}

function previewBatch(req, res) {
  const qty = mockService.readQuantity(req.query.qty);
  if (qty === null) return res.status(400).json({ error: QUANTITY_ERROR });

  res.json(mockService.previewBatch(qty));
}

async function seed(req, res) {
  const { nodeEnv } = require('../config');
  if (nodeEnv === 'production') {
    return res.status(403).json({ error: 'La carga de datos de prueba está deshabilitada en producción.' });
  }

  const qty = mockService.readQuantity(req.query.qty);
  if (qty === null) return res.status(400).json({ error: QUANTITY_ERROR });

  const { collection = 'users' } = req.query;
  if (collection !== 'users' && collection !== 'all') {
    return res.status(400).json({ error: 'collection debe ser users o all.' });
  }

  res.status(201).json(await mockService.seed(qty, collection));
}

module.exports = { previewUsers, previewBatch, seed };
