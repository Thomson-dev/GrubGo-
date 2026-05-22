// Typed Socket.IO event maps — keeps client and server events explicit

export interface ClientToServerEvents {
  // Restaurant owner joins their private room to receive incoming orders
  join_restaurant_room: (restaurantId: string) => void;

  // Customer joins a room for a specific order to track its status
  join_order_room: (orderId: string) => void;

  // Rider joins their personal room to receive assignment notifications
  join_rider_room: (riderId: string) => void;

  // Rider continuously sends GPS position while on a delivery
  rider_location_update: (payload: RiderLocationPayload) => void;
}

export interface ServerToClientEvents {
  // Sent to restaurant room when a customer places a new order
  new_order: (order: NewOrderPayload) => void;

  // Sent to the order room whenever the order status changes
  order_status_changed: (payload: OrderStatusPayload) => void;

  // Sent to the order room with the rider's latest GPS coordinates
  rider_location: (payload: RiderLocationPayload) => void;

  // Sent to a rider when they are assigned to an order
  order_assigned: (payload: OrderAssignedPayload) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

// Socket data stored per connection (set after JWT auth)
export interface SocketData {
  userId: string;
  role: 'customer' | 'restaurant' | 'rider' | 'admin';
}

// --- Payload shapes ---

export interface NewOrderPayload {
  orderId: string;
  restaurantId: string;
  customerId: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  deliveryAddress: object;
  createdAt: string;
}

export interface OrderStatusPayload {
  orderId: string;
  status: string;
  updatedAt: string;
}

export interface RiderLocationPayload {
  orderId: string;
  riderId: string;
  lat: number;
  lng: number;
}

export interface OrderAssignedPayload {
  orderId: string;
  restaurantId: string;
  deliveryAddress: object;
  totalAmount: number;
}
