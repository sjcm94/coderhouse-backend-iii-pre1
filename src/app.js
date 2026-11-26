const express = require('express');
const productRoutes = require('./routes/product.routes');
const userRoutes = require('./routes/user.routes');
const orderRoutes = require('./routes/order.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const docsRoutes = require('./routes/docs.routes');
const healthRoutes = require('./routes/health.routes');
const mockRoutes = require('./routes/mock.routes');
const loggerRoutes = require('./routes/logger.routes');
const logRequest = require('./middlewares/request-log.middleware');
const { notFound, handleError } = require('./middlewares/error.middleware');

const app = express();

app.use(logRequest);
app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/mocks', mockRoutes);
app.use('/api/logger', loggerRoutes);

app.use(notFound);
app.use(handleError);

module.exports = app;
