const express = require('express');
const productRoutes = require('./routes/product.routes');
const userRoutes = require('./routes/user.routes');
const mockRoutes = require('./routes/mock.routes');

const app = express();

app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mocks', mockRoutes);

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo debe contener JSON válido.' });
  }

  res.status(500).json({ error: 'Ocurrió un error interno.' });
});

module.exports = app;
