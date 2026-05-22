import { Router, Request, Response } from 'express';
import Rider from '../models/Rider';

const router = Router();

// Simple key check — same pattern as other services
router.use((req: Request, res: Response, next) => {
  if (req.headers['x-internal-key'] !== process.env.INTERNAL_API_KEY) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
});

// GET /internal/admin/riders  — all riders
router.get('/admin/riders', async (_req: Request, res: Response) => {
  try {
    const riders = await Rider.find().sort({ createdAt: -1 });
    res.status(200).json({ riders });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

// PATCH /internal/admin/riders/:id/verify
router.patch('/admin/riders/:id/verify', async (req: Request, res: Response) => {
  try {
    const { isVerified } = req.body as { isVerified: boolean };
    const rider = await Rider.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true }
    );
    if (!rider) {
      res.status(404).json({ message: 'Rider not found' });
      return;
    }
    res.status(200).json({ message: `Rider ${isVerified ? 'approved' : 'rejected'}`, rider });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

// GET /internal/admin/stats
router.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const [totalRiders, verifiedRiders, activeRiders, pendingRiders] = await Promise.all([
      Rider.countDocuments(),
      Rider.countDocuments({ isVerified: true }),
      Rider.countDocuments({ status: 'on_delivery' }),
      Rider.countDocuments({ isVerified: false }),
    ]);
    res.status(200).json({ totalRiders, verifiedRiders, activeRiders, pendingRiders });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
