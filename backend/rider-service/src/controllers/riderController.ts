import { Request, Response } from 'express';
import Rider from '../models/Rider';

// POST /api/rider/profile
export const createProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Rider.findOne({ userId: req.user!.id });
    if (existing) {
      res.status(409).json({ message: 'Rider profile already exists' });
      return;
    }
    const rider = await Rider.create({ ...req.body, userId: req.user!.id });
    res.status(201).json({ message: 'Profile created', rider });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// GET /api/rider/profile
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const rider = await Rider.findOne({ userId: req.user!.id });
    if (!rider) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.status(200).json({ rider });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// PUT /api/rider/profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Prevent overwriting verified status or userId via request body
    const { isVerified, userId, ...safeUpdates } = req.body;
    void isVerified; void userId; // suppress unused variable warnings

    const rider = await Rider.findOneAndUpdate(
      { userId: req.user!.id },
      safeUpdates,
      { new: true, runValidators: true }
    );
    if (!rider) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.status(200).json({ message: 'Profile updated', rider });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// PATCH /api/rider/status
// Rider toggles between available / offline before starting their shift
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status: 'offline' | 'available' };

    const rider = await Rider.findOne({ userId: req.user!.id });
    if (!rider) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    if (!rider.isVerified) {
      res.status(403).json({ message: 'Your account is pending admin verification' });
      return;
    }
    if (rider.status === 'on_delivery') {
      res.status(400).json({ message: 'Cannot change status while on a delivery' });
      return;
    }

    rider.status = status;
    await rider.save();
    res.status(200).json({ message: 'Status updated', status: rider.status });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
