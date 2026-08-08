import { Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.nativeEnum(Role),
  shopId: z.string().optional(),
  customPermissions: z.array(z.string()).optional(),
  phoneNumber: z.string().optional(),
});

export const updatePermissionsSchema = z.object({
  customPermissions: z.array(z.string()).min(0),
});

export class UserController {
  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId } = req.query;
      const users = await UserService.getUsers(businessId, shopId as string);
      return ApiResponse.success(res, users, 'Users retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const user = await UserService.createUser(businessId, req.body);
      return ApiResponse.success(res, user, 'Staff user created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updatePermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const user = await UserService.updatePermissions(id, businessId, req.body.customPermissions);
      return ApiResponse.success(res, user, 'User permissions updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async toggleStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const user = await UserService.toggleUserStatus(id, businessId);
      const statusText = user.active ? 'reactivated' : 'suspended';
      return ApiResponse.success(res, user, `User account ${statusText} successfully`);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await UserService.deleteUser(id, businessId);
      return ApiResponse.success(res, null, 'User deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
