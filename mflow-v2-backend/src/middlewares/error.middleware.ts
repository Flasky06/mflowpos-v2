import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response.util';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('❌ Global Error Handler:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';

  return ApiResponse.error(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
}
