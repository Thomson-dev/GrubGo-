import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));
app.use(express.json());

// Strict rate limit on auth endpoints — max 20 requests per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_req, res) => res.json({ status: 'Auth service running' }));
app.use('/api/auth', authLimiter, authRoutes);

// Must be registered after all routes
app.use(errorHandler);

const PORT = process.env.PORT ?? 5001;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Auth service listening on port ${PORT}`));
});
