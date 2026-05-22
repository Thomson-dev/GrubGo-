import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

export interface JwtPayload {
  id: string;
  role: UserRole;
}

// Extend Express Request so req.user is typed everywhere
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
    req.user = decoded; // { id, role } available in all downstream handlers
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Role '${req.user?.role}' is not allowed to access this route`,
      });
      return;
    }
    next();
  };
};
