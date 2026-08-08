import { Response } from 'express';
import { z } from 'zod';
import { BusinessService } from '../services/business.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ShopType } from '@prisma/client';

export const updateBusinessSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currency: z.string().optional(),
  address: z.string().optional(),
});

export const createShopSchema = z.object({
  name: z.string().min(2, 'Shop name is required'),
  location: z.string().optional(),
  phone: z.string().optional(),
  shopType: z.nativeEnum(ShopType).optional(),
});

export class BusinessController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const business = await BusinessService.getBusinessProfile(businessId);
      return ApiResponse.success(res, business, 'Business profile retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const updated = await BusinessService.updateBusinessProfile(businessId, req.body);
      return ApiResponse.success(res, updated, 'Business profile updated');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getShops(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const shops = await BusinessService.getShops(businessId);
      return ApiResponse.success(res, shops, 'Shops retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createShop(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const shop = await BusinessService.createShop(businessId, req.body, req.user?.userId);
      return ApiResponse.success(res, shop, 'Shop branch created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateShop(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { shopId } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const shop = await BusinessService.updateShop(shopId, businessId, req.body, req.user?.userId);
      return ApiResponse.success(res, shop, 'Shop branch updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteShop(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { shopId } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await BusinessService.deleteShop(shopId, businessId, req.user?.userId);
      return ApiResponse.success(res, null, 'Shop branch deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
