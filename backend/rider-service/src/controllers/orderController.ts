import { Request, Response } from 'express';
import Rider from '../models/Rider';
import { restaurantService } from '../config/serviceClient';

// GET /api/rider/orders/available
// Returns orders with status 'ready' that haven't been assigned yet
export const getAvailableOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const rider = await Rider.findOne({ userId: req.user!.id });
    if (!rider?.isVerified) {
      res.status(403).json({ message: 'Account pending verification' });
      return;
    }
    if (rider.status !== 'available') {
      res.status(400).json({ message: 'Set your status to available first' });
      return;
    }

    const response = await restaurantService.getReadyOrders();
    res.status(200).json({ orders: response.data.orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// POST /api/rider/orders/:id/accept
// Rider claims an order — sets them as on_delivery
export const acceptOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const rider = await Rider.findOne({ userId: req.user!.id });
    if (!rider) {
      res.status(404).json({ message: 'Rider profile not found' });
      return;
    }
    if (!rider.isVerified) {
      res.status(403).json({ message: 'Account pending verification' });
      return;
    }
    if (rider.status !== 'available') {
      res.status(400).json({ message: 'You are already on a delivery or offline' });
      return;
    }

    // Tell restaurant-service to assign this rider — it also notifies realtime-service
    const response = await restaurantService.assignRider(
      req.params.id,
      rider.userId
    );

    // Mark rider as on_delivery so they can't grab another order simultaneously
    rider.status = 'on_delivery';
    await rider.save();

    res.status(200).json({ message: 'Order accepted', order: response.data.order });
  } catch (err: unknown) {
    const status = (err as { response?: { status: number } }).response?.status;
    if (status === 409) {
      res.status(409).json({ message: 'Order was already taken by another rider' });
      return;
    }
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// PATCH /api/rider/orders/:id/status
// Body: { status: 'picked_up' | 'delivered' }
export const updateDeliveryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status: 'picked_up' | 'delivered' };

    const rider = await Rider.findOne({ userId: req.user!.id });
    if (!rider) {
      res.status(404).json({ message: 'Rider profile not found' });
      return;
    }

    await restaurantService.updateRiderStatus(req.params.id, rider.userId, status);

    // When delivery is complete, free up the rider
    if (status === 'delivered') {
      rider.status = 'available';
      rider.totalDeliveries += 1;
      await rider.save();
    }

    res.status(200).json({ message: 'Delivery status updated', status });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
