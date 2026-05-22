import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

app.get('/health', (_req, res) => res.json({ status: 'Admin service running' }));
app.use('/api/admin', limiter, adminRoutes);
app.use(errorHandler);

const PORT = process.env.PORT ?? 5006;
connectDB().then(() => app.listen(PORT, () => console.log(`Admin service listening on port ${PORT}`)));
