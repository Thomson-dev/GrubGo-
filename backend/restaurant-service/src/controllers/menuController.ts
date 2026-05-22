import { Request, Response } from 'express';
import Restaurant from '../models/Restaurant';
import MenuItem from '../models/MenuItem';

const getOwnedRestaurant = async (ownerId: string) => {
  return Restaurant.findOne({ ownerId });
};

// POST /api/restaurant/menu
export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await getOwnedRestaurant(req.user!.id);
    if (!restaurant) {
      res.status(404).json({ message: 'Create a restaurant profile first' });
      return;
    }

    const item = await MenuItem.create({ ...req.body, restaurantId: restaurant._id });
    res.status(201).json({ message: 'Menu item created', item });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/restaurant/menu
export const getMyMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await getOwnedRestaurant(req.user!.id);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const items = await MenuItem.find({ restaurantId: restaurant._id }).populate('categoryId', 'name');
    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// PUT /api/restaurant/menu/:id
export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await getOwnedRestaurant(req.user!.id);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }
    res.status(200).json({ message: 'Menu item updated', item });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// DELETE /api/restaurant/menu/:id
export const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await getOwnedRestaurant(req.user!.id);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const deleted = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      restaurantId: restaurant._id,
    });
    if (!deleted) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }
    res.status(200).json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/restaurants/:id/menu  (public)
export const getPublicMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await MenuItem.find({
      restaurantId: req.params.id,
      isAvailable: true,
    }).populate('categoryId', 'name image');
    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
