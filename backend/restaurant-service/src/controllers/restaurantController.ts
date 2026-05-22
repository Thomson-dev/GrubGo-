import { Request, Response } from 'express';
import Restaurant from '../models/Restaurant';

// POST /api/restaurant/profile
export const createProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Restaurant.findOne({ ownerId: req.user!.id });
    if (existing) {
      res.status(409).json({ message: 'Restaurant profile already exists' });
      return;
    }

    const restaurant = await Restaurant.create({ ...req.body, ownerId: req.user!.id });
    res.status(201).json({ message: 'Profile created', restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/restaurant/profile
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.status(200).json({ restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// PUT /api/restaurant/profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: req.user!.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!restaurant) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.status(200).json({ message: 'Profile updated', restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/restaurants  (public — only verified, open restaurants)
export const listRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, cuisine } = req.query;
    const filter: Record<string, unknown> = { isVerified: true };
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (cuisine) filter['cuisine'] = { $in: [cuisine] };

    const restaurants = await Restaurant.find(filter).select('-ownerId');
    res.status(200).json({ restaurants });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/restaurants/:id  (public)
export const getRestaurant = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).select('-ownerId');
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    res.status(200).json({ restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
