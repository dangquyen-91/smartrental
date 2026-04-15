require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const { apiLimiter, authLimiter } = require('./config/rate-limiter');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const propertyRoutes = require('./routes/property.routes');
const uploadRoutes = require('./routes/upload.routes');
const errorHandler = require('./middleware/error-handler.middleware');

connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: (req) => req.path === '/health',
  }));
}

app.use(express.json());
app.use('/api', apiLimiter);

app.get('/health', (_req, res) =>
  res.json({ success: true, message: 'OK', data: { env: process.env.NODE_ENV } })
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/upload', uploadRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
