import { Request, Response, NextFunction } from 'express';
import { TokenUtil } from '../utils/token.util';
import { ApiResponse } from '../utils/response.util';
import { Role } from '@prisma/client';
import { prisma } from '../config/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: Role;
    businessId?: string;
    shopId?: string;
    customPermissions?: string[];
  };
}

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Access token missing or malformed', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = TokenUtil.verifyAccessToken(token);

    // Verify user account activity status in database
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { business: { select: { active: true } } },
    });

    if (!dbUser) {
      return ApiResponse.error(res, 'User account no longer exists', 401);
    }

    if (!dbUser.active) {
      return ApiResponse.error(res, 'Your user account has been suspended. Please contact platform support.', 403);
    }

    if (dbUser.business && !dbUser.business.active) {
      return ApiResponse.error(res, 'Your business account has been suspended by platform administration.', 403);
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as Role,
      businessId: payload.businessId || undefined,
      shopId: payload.shopId || undefined,
      customPermissions: dbUser.customPermissions || [],
    };

    next();
  } catch (err: any) {
    return ApiResponse.error(res, 'Invalid or expired access token', 401);
  }
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(res, 'Forbidden: Insufficient role permissions', 403);
    }

    next();
  };
};

export const checkPermission = (permissionCode: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    // ADMIN and SUPER_ADMIN bypass custom permission checks
    if (req.user.role === Role.SUPER_ADMIN || req.user.role === Role.ADMIN) {
      return next();
    }

    const hasPerm = req.user.customPermissions?.includes(permissionCode);
    if (!hasPerm) {
      return ApiResponse.error(res, `Forbidden: Missing required permission '${permissionCode}'`, 403);
    }

    next();
  };
};
