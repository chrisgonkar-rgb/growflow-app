// Growflow Error Handler Middleware
// © TrueNorth Group of Companies Ltd.

import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry. This record already exists.',
    });
    return;
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    res.status(400).json({
      success: false,
      error: 'Referenced record does not exist.',
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
}
