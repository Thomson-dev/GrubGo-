import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from './middleware/socketAuth';
import { registerSocketHandlers } from './handlers/socketHandlers';
import { createInternalRouter } from './routes/internalRoutes';
import { startOrderConsumer } from './consumers/orderConsumer';
import { errorHandler } from './middleware/errorHandler';
import {
  ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData,
} from './types';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  { cors: { origin: '*', methods: ['GET', 'POST'] } }
);

io.use(socketAuthMiddleware);
io.on('connection', (socket) => registerSocketHandlers(io, socket));

app.get('/health', (_req, res) => res.json({ status: 'Realtime service running' }));
app.use('/internal', createInternalRouter(io));
app.use(errorHandler);

const PORT = process.env.PORT ?? 5004;
httpServer.listen(PORT, () => {
  console.log(`Realtime service listening on port ${PORT}`);
  // Start consuming RabbitMQ events after the HTTP server is up
  startOrderConsumer(io).catch((err) => {
    console.error('[rabbitmq] consumer failed to start:', err);
    process.exit(1);
  });
});
