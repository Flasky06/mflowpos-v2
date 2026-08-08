import { Request, Response } from 'express';
import { z } from 'zod';
import { SubscriptionService } from '../services/subscription.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { SubscriptionStatus } from '@prisma/client';

export const upgradeSubscriptionSchema = z.object({
  planCode: z.string().min(1, 'Plan code is required (STARTER, GROWTH, ENTERPRISE)'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  transactionRef: z.string().optional(),
});

export const extendTrialSchema = z.object({
  extraDays: z.number().int().positive('Extra days must be positive'),
});

export const updatePlanSchema = z.object({
  name: z.string().optional(),
  price: z.number().nonnegative().optional(),
  maxShops: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export class SubscriptionController {
  static async getPlans(req: Request, res: Response) {
    try {
      const plans = await SubscriptionService.getPlans();
      return ApiResponse.success(res, plans, 'Subscription plans retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getAllPlans(req: Request, res: Response) {
    try {
      const plans = await SubscriptionService.getAllPlans();
      return ApiResponse.success(res, plans, 'All subscription plans retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updatePlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await SubscriptionService.updatePlan(id, req.body);
      return ApiResponse.success(res, updated, 'Subscription plan updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getCurrentSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const subscriptionData = await SubscriptionService.getCurrentSubscription(businessId);
      return ApiResponse.success(res, subscriptionData, 'Current subscription status retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async upgrade(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const result = await SubscriptionService.upgradeSubscription(
        businessId,
        req.body.planCode,
        req.body.paymentMethod,
        req.body.transactionRef
      );
      return ApiResponse.success(res, result, 'Subscription upgraded successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  // SuperAdmin Platform Operations
  static async getTenants(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, status } = req.query;
      const tenants = await SubscriptionService.getTenants(
        search as string,
        status as SubscriptionStatus
      );
      return ApiResponse.success(res, tenants, 'Tenants list retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async suspendTenant(req: AuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const result = await SubscriptionService.suspendTenant(businessId);
      return ApiResponse.success(res, result, 'Tenant subscription suspended successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async reactivateTenant(req: AuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const result = await SubscriptionService.reactivateTenant(businessId);
      return ApiResponse.success(res, result, 'Tenant subscription reactivated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async extendTrial(req: AuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const { extraDays } = req.body;

      const result = await SubscriptionService.extendTrial(businessId, extraDays);
      return ApiResponse.success(res, result, 'Trial extended successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getPlatformRevenue(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const revenueData = await SubscriptionService.getPlatformRevenue(
        startDate as string,
        endDate as string
      );
      return ApiResponse.success(res, revenueData, 'Platform revenue retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
