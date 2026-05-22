import axios from 'axios';

const internalHeaders = () => ({
  'x-internal-key': process.env.INTERNAL_API_KEY as string,
  'Content-Type': 'application/json',
});

export const restaurantService = {
  getReadyOrders: () =>
    axios.get(`${process.env.RESTAURANT_SERVICE_URL}/internal/orders/ready`, {
      headers: internalHeaders(),
      timeout: 5000,
    }),

  assignRider: (orderId: string, riderId: string) =>
    axios.patch(
      `${process.env.RESTAURANT_SERVICE_URL}/internal/orders/${orderId}/assign`,
      { riderId },
      { headers: internalHeaders(), timeout: 5000 }
    ),

  updateRiderStatus: (orderId: string, riderId: string, status: 'picked_up' | 'delivered') =>
    axios.patch(
      `${process.env.RESTAURANT_SERVICE_URL}/internal/orders/${orderId}/rider-status`,
      { riderId, status },
      { headers: internalHeaders(), timeout: 5000 }
    ),
};
