import { Request, Response, NextFunction } from 'express';

// Global error handler — catches anything next(err) sends up
// Must have 4 parameters for Express to treat it as error middleware
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[error] ${err.message}`);
  res.status(500).json({ success: false, message: 'Internal server error' });
};
