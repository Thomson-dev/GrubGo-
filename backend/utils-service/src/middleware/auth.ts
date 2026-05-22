import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'customer' | 'restaurant' | 'rider' | 'admin';

export interface JwtPayload {
  id: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
