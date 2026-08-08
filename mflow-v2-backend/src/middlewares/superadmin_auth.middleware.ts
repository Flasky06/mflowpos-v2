import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { ApiResponse } from '../utils/response.util';
import { Role } from '@prisma/client';

export interface SuperAdminAuthenticatedRequest extends Request {
  superAdmin?: {
    userId: string;
    email: string;
    role: Role;
    isSuperAdmin: boolean;
  };
}

export const authenticateSuperAdminJWT = (
  req: SuperAdminAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'SuperAdmin Access Token Required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as any;

    if (!decoded || (decoded.role !== Role.SUPER_ADMIN && decoded.role !== Role.ADMIN)) {
      return ApiResponse.error(res, 'Forbidden: SuperAdmin Privileges Required', 403);
    }

    req.superAdmin = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isSuperAdmin: true,
    };

    next();
  } catch (err: any) {
    return ApiResponse.error(res, 'Invalid or Expired SuperAdmin Session Token', 401);
  }
};
