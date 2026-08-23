import { Response } from 'express';
import { z } from 'zod';
import { SuperAdminService } from '../services/superadmin.service';
import { ApiResponse } from '../utils/response.util';
import { SuperAdminAuthenticatedRequest } from '../middlewares/superadmin_auth.middleware';
import { Role, SubscriptionStatus } from '@prisma/client';

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
  customPermissions: z.array(z.string()).optional(),
});

export const resetUserPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const activateCashPaymentSchema = z.object({
  planCode: z.string().min(1, 'Plan code is required (STARTER, GROWTH, ENTERPRISE)'),
  amount: z.number().nonnegative().optional(),
  paymentMethod: z.string().optional(),
  transactionRef: z.string().optional(),
  validityMonths: z.number().int().positive().optional(),
});

export const overrideSubscriptionSchema = z.object({
  planCode: z.string().min(1, 'Plan code is required'),
  daysValidity: z.number().int().positive('Days validity must be positive'),
  status: z.nativeEnum(SubscriptionStatus).optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currency: z.string().optional(),
  active: z.boolean().optional(),
});

export class SuperAdminController {
  static async getPlatformStats(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const stats = await SuperAdminService.getPlatformStats();
      return ApiResponse.success(res, stats, 'Platform stats retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getAllUsers(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { search, role } = req.query;
      const users = await SuperAdminService.getAllUsers(search as string, role as Role);
      return ApiResponse.success(res, users, 'Platform users list retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateUserRole(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const updated = await SuperAdminService.updateUserRole(userId, req.body.role, req.body.customPermissions);
      return ApiResponse.success(res, updated, 'User role updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async suspendUser(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const result = await SuperAdminService.suspendUser(userId);
      return ApiResponse.success(res, result, 'User account suspended');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async reactivateUser(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const result = await SuperAdminService.reactivateUser(userId);
      return ApiResponse.success(res, result, 'User account reactivated');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async resetUserPassword(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const result = await SuperAdminService.resetUserPassword(userId, req.body.newPassword);
      return ApiResponse.success(res, result, 'User password reset successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteUser(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      await SuperAdminService.deleteUser(userId);
      return ApiResponse.success(res, null, 'User deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getAllBusinesses(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const businesses = await SuperAdminService.getAllBusinesses();
      return ApiResponse.success(res, businesses, 'Businesses list retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateBusiness(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const updated = await SuperAdminService.updateBusiness(businessId, req.body);
      return ApiResponse.success(res, updated, 'Business updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async toggleBusinessStatus(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const { status } = req.body;
      const result = await SuperAdminService.toggleBusinessStatus(businessId, status);
      return ApiResponse.success(res, result, 'Business status toggled successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async extendBusinessTrial(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const days = req.body.days || 14;
      const result = await SuperAdminService.extendBusinessTrial(businessId, days);
      return ApiResponse.success(res, result, `Business trial extended by ${days} days`);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getAllPayments(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const payments = await SuperAdminService.getAllPayments();
      return ApiResponse.success(res, payments, 'Platform payments list retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async activateCashPayment(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const result = await SuperAdminService.activateCashPayment(businessId, req.body);
      return ApiResponse.success(res, result, 'Manual cash subscription activated');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async overrideSubscription(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const { planCode, daysValidity, status } = req.body;
      const result = await SuperAdminService.overrideSubscription(
        businessId,
        planCode,
        daysValidity,
        status
      );
      return ApiResponse.success(res, result, 'Subscription override applied successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateTenantCustomPricing(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const { customPrice, status } = req.body;
      const numericPrice = customPrice !== undefined && customPrice !== null && customPrice !== ''
        ? parseFloat(customPrice)
        : null;

      const updated = await SuperAdminService.updateTenantCustomPricing(businessId, numericPrice, status);
      return ApiResponse.success(res, updated, 'Tenant custom pricing updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
