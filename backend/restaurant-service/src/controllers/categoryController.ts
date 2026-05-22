import { Request, Response } from 'express';
import Restaurant from '../models/Restaurant';
import Category from '../models/Category';

// helper: get restaurant owned by current user or 404
const getOwnedRestaurant = async (ownerId: string) => {
  return Restaurant.findOne({ ownerId });
};

// POST /api/restaurant/categories
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await getOwnedRestaurant(req.user!.id);
    if (!restaurant) {
      res.status(404).json({ message: 'Create a restaurant profile first' });
      return;
    }

    const category = await Category.create({ ...req.body, restaurantId: restaurant._id });
    res.status(201).json({ message: 'Category created', category });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/restaurant/categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await getOwnedRestaurant(req.user!.id);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const categories = await Category.find({ restaurantId: restaurant._id });
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// DELETE /api/restaurant/categories/:id
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await getOwnedRestaurant(req.user!.id);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const deleted = await Category.findOneAndDelete({
      _id: req.params.id,
      restaurantId: restaurant._id, // ensures ownership
    });

    if (!deleted) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.status(200).json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/restaurants/:id/categories  (public)
export const getPublicCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find({ restaurantId: req.params.id });
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
