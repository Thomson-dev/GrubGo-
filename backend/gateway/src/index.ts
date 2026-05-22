import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));

// Global rate limit — tighter limits can be added per-route below
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});
app.use(globalLimiter);

// Strict limit for auth routes — prevents brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, try again later.' },
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'Gateway running' }));

// ─── Proxy helpers ────────────────────────────────────────────────────────────
// changeOrigin: true — rewrites the Host header to match the target service
// Each proxy strips the matched prefix so services receive clean paths:
//   gateway: /api/auth/login  →  auth-service: /api/auth/login  (no strip needed here)

const proxy = (target: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    // Internal routes are never exposed through the gateway — services call each
    // other directly over the Docker network using /internal/* paths
    on: {
      error: (err, _req, res) => {
        console.error('[gateway] proxy error:', err.message);
        if ('status' in res) {
          (res as express.Response)
            .status(502)
            .json({ success: false, message: 'Service temporarily unavailable' });
        }
      },
    },
  });

// ─── Route table ──────────────────────────────────────────────────────────────
//
// Rule: one path prefix per service. The Flutter app only ever talks to the
// gateway (port 5000); it never needs to know individual service ports.
//
// /api/auth/*          → auth-service          (login, register, OTP, refresh)
// /api/restaurants/*   → restaurant-service    (menus, cart, categories)
// /api/orders/*        → restaurant-service    (place order, order history)
// /api/rider/*         → rider-service         (rider profile, accept order)
// /api/payments/*      → utils-service         (Stripe, Paystack)
// /api/upload/*        → utils-service         (Cloudinary)
// /api/admin/*         → admin-service         (verify restaurants/riders)
// /socket.io/*         → realtime-service      (Socket.IO — WebSocket upgrade)

app.use('/api/auth', authLimiter, proxy(process.env.AUTH_SERVICE_URL ?? 'http://localhost:5001'));

app.use('/api/restaurants', proxy(process.env.RESTAURANT_SERVICE_URL ?? 'http://localhost:5002'));
app.use('/api/orders',      proxy(process.env.RESTAURANT_SERVICE_URL ?? 'http://localhost:5002'));
app.use('/api/cart',        proxy(process.env.RESTAURANT_SERVICE_URL ?? 'http://localhost:5002'));
app.use('/api/categories',  proxy(process.env.RESTAURANT_SERVICE_URL ?? 'http://localhost:5002'));
app.use('/api/menu',        proxy(process.env.RESTAURANT_SERVICE_URL ?? 'http://localhost:5002'));
app.use('/api/addresses',   proxy(process.env.RESTAURANT_SERVICE_URL ?? 'http://localhost:5002'));

app.use('/api/rider',       proxy(process.env.RIDER_SERVICE_URL ?? 'http://localhost:5005'));

app.use('/api/payments',    proxy(process.env.UTILS_SERVICE_URL ?? 'http://localhost:5003'));
app.use('/api/upload',      proxy(process.env.UTILS_SERVICE_URL ?? 'http://localhost:5003'));

app.use('/api/admin',       proxy(process.env.ADMIN_SERVICE_URL ?? 'http://localhost:5006'));

// Socket.IO requires WebSocket upgrade support — handled at the raw http.Server level
// The Flutter socket client should connect to ws://gateway:5000 (not the realtime-service directly)
const wsProxy = createProxyMiddleware({
  target: process.env.REALTIME_SERVICE_URL ?? 'http://localhost:5004',
  changeOrigin: true,
  ws: true, // enable WebSocket proxying
});
app.use('/socket.io', wsProxy);

// ─── 404 for anything not matched ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 5000;

// Use http.createServer so we can attach the WebSocket proxy upgrade handler
const server = http.createServer(app);

// Forward WebSocket upgrade events to the Socket.IO proxy
server.on('upgrade', wsProxy.upgrade as Parameters<typeof server.on>[1]);

server.listen(PORT, () => console.log(`Gateway listening on port ${PORT}`));
