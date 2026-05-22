import { Router, Request, Response } from 'express';
import { internalAuth } from '../middleware/internalAuth';
import Order from '../models/Order';
import { publishEvent } from '../config/rabbitmq';

const router = Router();
router.use(internalAuth);

// GET /internal/orders/ready  — rider-service fetches orders awaiting pickup
router.get('/orders/ready', async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find({ status: 'ready', riderId: null })
      .sort({ createdAt: 1 })
      .populate('restaurantId', 'name address phone');
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

// PATCH /internal/orders/:id/assign  — rider-service assigns itself to an order
router.patch('/orders/:id/assign', async (req: Request, res: Response) => {
  try {
    const { riderId } = req.body as { riderId: string };

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'ready', riderId: null }, // only grab unassigned ready orders
      { riderId, status: 'picked_up' },
      { new: true }
    );

    if (!order) {
      res.status(409).json({ message: 'Order already taken or not ready' });
      return;
    }

    // Publish — realtime-service notifies both the rider and the customer
    publishEvent('order.assigned', {
      orderId: order._id.toString(),
      riderId,
      restaurantId: order.restaurantId.toString(),
      deliveryAddress: order.deliveryAddress,
      totalAmount: order.totalAmount,
    });

    res.status(200).json({ order });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

// PATCH /internal/orders/:id/rider-status  — rider updates to picked_up or delivered
router.patch('/orders/:id/rider-status', async (req: Request, res: Response) => {
  try {
    const { riderId, status } = req.body as { riderId: string; status: 'picked_up' | 'delivered' };

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, riderId },
      { status },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ message: 'Order not found or not assigned to this rider' });
      return;
    }

    publishEvent('delivery.status_updated', {
      orderId: order._id.toString(),
      status: order.status,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({ order });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

// PATCH /internal/orders/:id/mark-paid  — called by utils-service after payment confirmed
router.patch('/orders/:id/mark-paid', async (req: Request, res: Response) => {
  try {
    const { paymentId, paymentMethod } = req.body as { paymentId: string; paymentMethod: string };
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isPaid: true, paymentId, status: 'accepted' },
      { new: true }
    );
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }

    // Publish paid order — realtime-service pushes it to the restaurant's dashboard room
    publishEvent('order.placed', {
      orderId: order._id.toString(),
      restaurantId: order.restaurantId.toString(),
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ order });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

// --- Admin endpoints ---

// GET /internal/admin/restaurants  — all restaurants (verified or not)
router.get('/admin/restaurants', async (_req: Request, res: Response) => {
  try {
    const restaurants = await (await import('../models/Restaurant')).default.find().sort({ createdAt: -1 });
    res.status(200).json({ restaurants });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

// PATCH /internal/admin/restaurants/:id/verify
router.patch('/admin/restaurants/:id/verify', async (req: Request, res: Response) => {
  try {
    const { isVerified } = req.body as { isVerified: boolean };
    const restaurant = await (await import('../models/Restaurant')).default.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true }
    );
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    res.status(200).json({ message: `Restaurant ${isVerified ? 'approved' : 'rejected'}`, restaurant });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

// GET /internal/admin/orders  — all orders across all restaurants
router.get('/admin/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('restaurantId', 'name');
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

// GET /internal/admin/stats
router.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const [totalOrders, totalRevenue, pendingRestaurants] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      (await import('../models/Restaurant')).default.countDocuments({ isVerified: false }),
    ]);

    res.status(200).json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total ?? 0,
      pendingRestaurants,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
