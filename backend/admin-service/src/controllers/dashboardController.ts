import { Request, Response } from 'express';
import { restaurantApi, riderApi } from '../config/serviceClient';

// GET /api/admin/stats
// Aggregates stats from restaurant-service and rider-service in parallel
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [restaurantStats, riderStats] = await Promise.all([
      restaurantApi.getStats(),
      riderApi.getStats(),
    ]);

    res.status(200).json({
      orders: {
        total: restaurantStats.data.totalOrders,
        revenue: restaurantStats.data.totalRevenue,
      },
      restaurants: {
        pendingVerification: restaurantStats.data.pendingRestaurants,
      },
      riders: {
        total: riderStats.data.totalRiders,
        verified: riderStats.data.verifiedRiders,
        activeNow: riderStats.data.activeRiders,
        pendingVerification: riderStats.data.pendingRiders,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: (err as Error).message });
  }
};
