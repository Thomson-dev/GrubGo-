import { Request, Response } from 'express';
import Cart from '../models/Cart';
import MenuItem from '../models/MenuItem';

// GET /api/cart
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne({ customerId: req.user!.id })
      .populate('restaurantId', 'name coverImage');
    res.status(200).json({ success: true, cart: cart ?? null });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// POST /api/cart/add
// Body: { menuItemId, restaurantId, quantity }
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { menuItemId, restaurantId, quantity = 1 } = req.body as {
      menuItemId: string; restaurantId: string; quantity: number;
    };

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      res.status(404).json({ success: false, message: 'Item not available' });
      return;
    }

    let cart = await Cart.findOne({ customerId: req.user!.id });

    // If cart belongs to a different restaurant — clear it first
    if (cart && cart.restaurantId.toString() !== restaurantId) {
      cart.restaurantId = menuItem.restaurantId;
      cart.items = [];
    }

    if (!cart) {
      cart = new Cart({ customerId: req.user!.id, restaurantId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.menuItemId.toString() === menuItemId
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        image: menuItem.image,
        quantity,
      });
    }

    await cart.save(); // pre-save hook recalculates totalAmount
    res.status(200).json({ success: true, message: 'Added to cart', cart });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// PATCH /api/cart/item/:menuItemId
// Body: { quantity }  — set absolute quantity (0 = remove)
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quantity } = req.body as { quantity: number };
    const { menuItemId } = req.params;

    const cart = await Cart.findOne({ customerId: req.user!.id });
    if (!cart) { res.status(404).json({ success: false, message: 'Cart not found' }); return; }

    const index = cart.items.findIndex((i) => i.menuItemId.toString() === menuItemId);
    if (index === -1) { res.status(404).json({ success: false, message: 'Item not in cart' }); return; }

    if (quantity <= 0) {
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = quantity;
    }

    // If cart is now empty, delete it entirely
    if (cart.items.length === 0) {
      await cart.deleteOne();
      res.status(200).json({ success: true, message: 'Cart cleared', cart: null });
      return;
    }

    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// DELETE /api/cart
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    await Cart.deleteOne({ customerId: req.user!.id });
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
