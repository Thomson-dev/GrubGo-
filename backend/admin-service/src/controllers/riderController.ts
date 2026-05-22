import { Request, Response } from 'express';
import { riderApi } from '../config/serviceClient';

// GET /api/admin/riders
export const getAllRiders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await riderApi.getAllRiders();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch riders', error: (err as Error).message });
  }
};

// PATCH /api/admin/riders/:id/verify
// Body: { isVerified: true | false }
export const verifyRider = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isVerified } = req.body as { isVerified: boolean };
    const { data } = await riderApi.verifyRider(req.params.id, isVerified);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update rider', error: (err as Error).message });
  }
};
