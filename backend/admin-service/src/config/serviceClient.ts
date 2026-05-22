import axios from 'axios';

const internalHeaders = () => ({
  'x-internal-key': process.env.INTERNAL_API_KEY as string,
});

export const restaurantApi = {
  getAllRestaurants: () =>
    axios.get(`${process.env.RESTAURANT_SERVICE_URL}/internal/admin/restaurants`, {
      headers: internalHeaders(),
    }),

  verifyRestaurant: (id: string, isVerified: boolean) =>
    axios.patch(
      `${process.env.RESTAURANT_SERVICE_URL}/internal/admin/restaurants/${id}/verify`,
      { isVerified },
      { headers: internalHeaders() }
    ),

  getAllOrders: () =>
    axios.get(`${process.env.RESTAURANT_SERVICE_URL}/internal/admin/orders`, {
      headers: internalHeaders(),
    }),

  getStats: () =>
    axios.get(`${process.env.RESTAURANT_SERVICE_URL}/internal/admin/stats`, {
      headers: internalHeaders(),
    }),
};

export const riderApi = {
  getAllRiders: () =>
    axios.get(`${process.env.RIDER_SERVICE_URL}/internal/admin/riders`, {
      headers: internalHeaders(),
    }),

  verifyRider: (id: string, isVerified: boolean) =>
    axios.patch(
      `${process.env.RIDER_SERVICE_URL}/internal/admin/riders/${id}/verify`,
      { isVerified },
      { headers: internalHeaders() }
    ),

  getStats: () =>
    axios.get(`${process.env.RIDER_SERVICE_URL}/internal/admin/stats`, {
      headers: internalHeaders(),
    }),
};
