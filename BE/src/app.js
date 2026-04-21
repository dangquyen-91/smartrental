import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import connectDB from './config/db.js';
import { apiLimiter, authLimiter } from './config/rate-limiter.js';
import swaggerSpec from './config/swagger.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import propertyRoutes from './routes/property.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import contractRoutes from './routes/contract.routes.js';
import roommateRoutes from './routes/roommate.routes.js';
import serviceRoutes from './routes/service.routes.js';
import errorHandler from './middleware/error-handler.middleware.js';

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
app.use('/api/bookings', bookingRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/roommates', roommateRoutes);
app.use('/api/services', serviceRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
