import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.path} - Status: ${statusCode} - Message: ${message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
};
