const express = require('express');
const productRoutes = require('./routes/product.routes');
const userRoutes = require('./routes/user.routes');
const mockRoutes = require('./routes/mock.routes');
const { notFound, handleError } = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mocks', mockRoutes);

app.use(notFound);
app.use(handleError);

module.exports = app;
