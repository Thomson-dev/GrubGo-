import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import { connectRabbitMQ } from './config/rabbitmq';
import restaurantRoutes from './routes/restaurantRoutes';
import internalRoutes from './routes/internalRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));

// Stripe webhook needs raw body — mount before express.json()
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_req, res) => res.json({ status: 'Restaurant service running' }));
app.use('/api', apiLimiter, restaurantRoutes);
app.use('/internal', internalRoutes);

app.use(errorHandler);

const PORT = process.env.PORT ?? 5002;

connectDB()
  .then(() => connectRabbitMQ())
  .then(() => {
    app.listen(PORT, () => console.log(`Restaurant service listening on port ${PORT}`));
  });
