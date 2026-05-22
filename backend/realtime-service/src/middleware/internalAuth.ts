import { Request, Response, NextFunction } from 'express';

// Protects internal-only routes — other microservices must include this key
// Never exposed to Flutter clients
export const internalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers['x-internal-key'];
  if (key !== process.env.INTERNAL_API_KEY) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};
