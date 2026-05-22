import { Request, Response } from 'express';
import Restaurant from '../models/Restaurant';
import Order, { OrderStatus } from '../models/Order';
import MenuItem from '../models/MenuItem';
import { publishEvent } from '../config/rabbitmq';

// POST /api/orders  (customer places order)
export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod } = req.body;

    // Fetch each item to get current price (never trust client-sent prices)
    const itemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: itemIds } });

    let totalAmount = 0;
    const orderItems = items.map((i: { menuItemId: string; quantity: number }) => {
      const found = menuItems.find((m) => m._id.toString() === i.menuItemId);
      if (!found) throw new Error(`Menu item ${i.menuItemId} not found`);
      totalAmount += found.price * i.quantity;
      return { menuItemId: found._id, name: found.name, price: found.price, quantity: i.quantity };
    });

    const order = await Order.create({
      customerId: req.user!.id,
      restaurantId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
    });

    // Publish to RabbitMQ — realtime-service consumes this and pushes to the restaurant's socket room
    publishEvent('order.placed', {
      orderId: order._id.toString(),
      restaurantId: order.restaurantId.toString(),
      customerId: order.customerId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Order placed', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/orders/my  (customer — their own orders)
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ customerId: req.user!.id })
      .sort({ createdAt: -1 })
      .populate('restaurantId', 'name coverImage');
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/restaurant/orders  (restaurant — orders for their restaurant)
export const getRestaurantOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    const orders = await Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// PUT /api/restaurant/orders/:id/status  (restaurant updates status)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status: OrderStatus };

    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      { status },
      { new: true }
    );
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Publish status change — realtime-service pushes this to the customer's tracking screen
    publishEvent('order.status_updated', {
      orderId: order._id.toString(),
      status: order.status,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({ message: 'Status updated', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
