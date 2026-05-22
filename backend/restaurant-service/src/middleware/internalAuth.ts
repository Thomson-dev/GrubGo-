import { Request, Response, NextFunction } from 'express';

export const internalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers['x-internal-key'];
  if (key !== process.env.INTERNAL_API_KEY) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};
