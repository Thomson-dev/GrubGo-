import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AdminJwtPayload {
  id: string;
  role: 'admin';
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

export const protectAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AdminJwtPayload;
    if (decoded.role !== 'admin') {
      res.status(403).json({ message: 'Admin access only' });
      return;
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
