import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  RiderLocationPayload,
} from '../types';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const registerSocketHandlers = (io: AppServer, socket: AppSocket): void => {
  const { userId, role } = socket.data;
  console.log(`[socket] connected — userId: ${userId}, role: ${role}, id: ${socket.id}`);

  // --- Room join events ---

  socket.on('join_restaurant_room', (restaurantId: string) => {
    if (role !== 'restaurant' && role !== 'admin') return;
    socket.join(`restaurant:${restaurantId}`);
    console.log(`[socket] ${userId} joined restaurant:${restaurantId}`);
  });

  socket.on('join_order_room', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`[socket] ${userId} joined order:${orderId}`);
  });

  socket.on('join_rider_room', (riderId: string) => {
    if (role !== 'rider') return;
    if (riderId !== userId) return; // riders can only join their own room
    socket.join(`rider:${riderId}`);
    console.log(`[socket] rider ${userId} joined rider:${riderId}`);
  });

  // --- Rider location ---
  // Rider emits this continuously while on delivery (Flutter calls this on GPS update)
  socket.on('rider_location_update', (payload: RiderLocationPayload) => {
    if (role !== 'rider') return;
    if (payload.riderId !== userId) return; // prevent spoofing another rider's location

    // Broadcast to everyone in the order room (the customer tracking the delivery)
    io.to(`order:${payload.orderId}`).emit('rider_location', payload);
  });

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected — userId: ${userId}`);
  });
};
