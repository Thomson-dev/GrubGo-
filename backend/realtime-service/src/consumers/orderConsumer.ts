import { Server } from 'socket.io';
import { connectRabbitMQ, startConsuming } from '../config/rabbitmq';
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

// Routing keys published by restaurant-service
const ROUTING = {
  ORDER_PLACED: 'order.placed',
  ORDER_STATUS: 'order.status_updated',
  ORDER_ASSIGNED: 'order.assigned',
  DELIVERY_STATUS: 'delivery.status_updated',
} as const;

export async function startOrderConsumer(io: AppServer): Promise<void> {
  await connectRabbitMQ();

  await startConsuming((routingKey, payload) => {
    switch (routingKey) {
      case ROUTING.ORDER_PLACED: {
        // New order arrived — push to the restaurant's dashboard room
        const p = payload as NewOrderPayload;
        io.to(`restaurant:${p.restaurantId}`).emit('new_order', p);
        break;
      }

      case ROUTING.ORDER_STATUS: {
        // Restaurant changed order status (accepted / preparing / ready)
        const p = payload as OrderStatusPayload;
        io.to(`order:${p.orderId}`).emit('order_status_changed', p);
        break;
      }

      case ROUTING.ORDER_ASSIGNED: {
        // Rider accepted the order
        const p = payload as OrderAssignedPayload & { riderId: string };
        // Tell the rider their next pickup
        io.to(`rider:${p.riderId}`).emit('order_assigned', p);
        // Tell the customer a rider is on the way
        io.to(`order:${p.orderId}`).emit('order_status_changed', {
          orderId: p.orderId,
          status: 'rider_assigned',
          updatedAt: new Date().toISOString(),
        });
        break;
      }

      case ROUTING.DELIVERY_STATUS: {
        // Rider marked picked_up or delivered
        const p = payload as { orderId: string; status: string };
        io.to(`order:${p.orderId}`).emit('order_status_changed', {
          orderId: p.orderId,
          status: p.status,
          updatedAt: new Date().toISOString(),
        });
        break;
      }

      default:
        console.warn('[consumer] unhandled routing key:', routingKey);
    }
  });
}
