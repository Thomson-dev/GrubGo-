import { Request, Response } from 'express';
import { restaurantApi } from '../config/serviceClient';

// GET /api/admin/restaurants
export const getAllRestaurants = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await restaurantApi.getAllRestaurants();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch restaurants', error: (err as Error).message });
  }
};

// PATCH /api/admin/restaurants/:id/verify
// Body: { isVerified: true | false }
export const verifyRestaurant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isVerified } = req.body as { isVerified: boolean };
    const { data } = await restaurantApi.verifyRestaurant(req.params.id, isVerified);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update restaurant', error: (err as Error).message });
  }
};

// GET /api/admin/orders
export const getAllOrders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await restaurantApi.getAllOrders();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: (err as Error).message });
  }
};
