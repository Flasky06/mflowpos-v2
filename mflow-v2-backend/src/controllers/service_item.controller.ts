import { Response } from 'express';
import { z } from 'zod';
import { ServiceItemService } from '../services/service_item.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  sellingPrice: z.number().positive('Price must be positive'),
  costPrice: z.number().optional(),
  categoryId: z.string().optional(),
  shopId: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
});

export class ServiceItemController {
  static async getServices(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId, categoryId, search } = req.query;
      const services = await ServiceItemService.getServices(
        businessId,
        shopId as string,
        categoryId as string,
        search as string
      );
      return ApiResponse.success(res, services, 'Services retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getServiceById(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const service = await ServiceItemService.getServiceById(id, businessId);
      return ApiResponse.success(res, service, 'Service details retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 404);
    }
  }

  static async createService(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const service = await ServiceItemService.createService(businessId, req.body, req.user?.userId);
      return ApiResponse.success(res, service, 'Service created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateService(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const updated = await ServiceItemService.updateService(id, businessId, req.body, req.user?.userId);
      return ApiResponse.success(res, updated, 'Service updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteService(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await ServiceItemService.deleteService(id, businessId, req.user?.userId);
      return ApiResponse.success(res, null, 'Service deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  // Service Categories Handlers
  static async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const categories = await ServiceItemService.getCategories(businessId);
      return ApiResponse.success(res, categories, 'Service categories retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { name } = req.body;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);
      if (!name) return ApiResponse.error(res, 'Category name is required', 400);

      const category = await ServiceItemService.createCategory(businessId, name, req.user?.userId);
      return ApiResponse.success(res, category, 'Service category created', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      const { name } = req.body;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);
      if (!name) return ApiResponse.error(res, 'Category name is required', 400);

      const category = await ServiceItemService.updateCategory(id, businessId, name, req.user?.userId);
      return ApiResponse.success(res, category, 'Service category updated');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await ServiceItemService.deleteCategory(id, businessId);
      return ApiResponse.success(res, null, 'Service category deleted');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
