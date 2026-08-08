import { Response } from 'express';
import { z } from 'zod';
import { SaleService } from '../services/sale.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ServiceOrderStatus } from '@prisma/client';

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        serviceId: z.string().optional(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1, 'Sale must contain at least one item'),
  payments: z
    .array(
      z.object({
        paymentMethod: z.string().min(1),
        amount: z.number().positive(),
      })
    )
    .min(1, 'Sale must contain at least one payment method'),
  customerId: z.string().optional(),
  serviceOrderStatus: z.nativeEnum(ServiceOrderStatus).optional(),
});

export const updateServiceOrderStatusSchema = z.object({
  status: z.nativeEnum(ServiceOrderStatus),
});

export class SaleController {
  static async createSale(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const shopId = req.user?.shopId;
      const userId = req.user?.userId;

      if (!businessId || !shopId || !userId) {
        return ApiResponse.error(res, 'Missing user, shop, or business context', 400);
      }

      const result = await SaleService.createSale(businessId, shopId, userId, req.body);
      return ApiResponse.success(res, result, 'Sale transaction processed successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getSales(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId, startDate, endDate, serviceOrderStatus } = req.query;
      const sales = await SaleService.getSales(
        businessId,
        shopId as string,
        startDate as string,
        endDate as string,
        serviceOrderStatus as ServiceOrderStatus
      );
      return ApiResponse.success(res, sales, 'Sales history retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getSaleById(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const result = await SaleService.getSaleById(id, businessId);
      return ApiResponse.success(res, result, 'Sale transaction details retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 404);
    }
  }

  static async updateServiceOrderStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!businessId || !userId) return ApiResponse.error(res, 'Authentication context required', 400);

      const updated = await SaleService.updateServiceOrderStatus(id, businessId, req.body.status, userId);
      return ApiResponse.success(res, updated, 'Service order status updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async cancelSale(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!businessId || !userId) return ApiResponse.error(res, 'Authentication context required', 400);

      const cancelled = await SaleService.cancelSale(id, businessId, userId);
      return ApiResponse.success(res, cancelled, 'Sale transaction cancelled');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
