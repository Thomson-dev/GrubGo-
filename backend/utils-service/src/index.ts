import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import uploadRoutes from './routes/uploadRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));

// Stripe & Paystack webhooks need raw body — mount BEFORE express.json()
app.use('/api/payment/stripe/webhook',   express.raw({ type: 'application/json' }));
app.use('/api/payment/paystack/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });

app.get('/health', (_req, res) => res.json({ status: 'Utils service running' }));
app.use('/api/upload',  limiter, uploadRoutes);
app.use('/api/payment', limiter, paymentRoutes);
app.use(errorHandler);

const PORT = process.env.PORT ?? 5003;
app.listen(PORT, () => console.log(`Utils service listening on port ${PORT}`));
