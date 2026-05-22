import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { internalAuth } from '../middleware/internalAuth';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  NewOrderPayload,
  OrderStatusPayload,
  OrderAssignedPayload,
} from '../types';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// io is injected so routes can emit to rooms
export const createInternalRouter = (io: AppServer) => {
  const router = Router();

  router.use(internalAuth);

  // Called by restaurant-service when a customer places a new order
  // POST /internal/new-order
  router.post('/new-order', (req: Request, res: Response) => {
    const payload = req.body as NewOrderPayload;
    // Emit to the restaurant's private room — their dashboard shows the order instantly
    io.to(`restaurant:${payload.restaurantId}`).emit('new_order', payload);
    res.status(200).json({ emitted: true });
  });

  // Called by restaurant-service when restaurant changes order status
  // POST /internal/order-status
  router.post('/order-status', (req: Request, res: Response) => {
    const payload = req.body as OrderStatusPayload;
    // Emit to the order room — the tracking customer sees the status change
    io.to(`order:${payload.orderId}`).emit('order_status_changed', payload);
    res.status(200).json({ emitted: true });
  });

  // Called by rider-service when a rider is assigned to an order
  // POST /internal/order-assigned
  router.post('/order-assigned', (req: Request, res: Response) => {
    const payload = req.body as OrderAssignedPayload;
    // Emit to rider's personal room — they get notified to go pick up the order
    io.to(`rider:${(req.body as { riderId: string }).riderId}`).emit('order_assigned', payload);
    // Also notify customer that a rider has been assigned
    io.to(`order:${payload.orderId}`).emit('order_status_changed', {
      orderId: payload.orderId,
      status: 'rider_assigned',
      updatedAt: new Date().toISOString(),
    });
    res.status(200).json({ emitted: true });
  });

  return router;
};
