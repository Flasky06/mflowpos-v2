import { Response } from 'express';
import { z } from 'zod';
import { StockReturnService } from '../services/stock_return.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { StockReturnType } from '@prisma/client';

export const createStockReturnSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  shopId: z.string().min(1, 'Shop ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  returnType: z.nativeEnum(StockReturnType).optional(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

export class StockReturnController {
  static async getStockReturns(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId } = req.query;
      const returns = await StockReturnService.getStockReturns(businessId, shopId as string);
      return ApiResponse.success(res, returns, 'Stock returns retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createStockReturn(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const userId = req.user?.userId;
      if (!businessId || !userId) return ApiResponse.error(res, 'Authentication context required', 400);

      const result = await StockReturnService.createStockReturn(businessId, req.body, userId);
      return ApiResponse.success(res, result, 'Stock return recorded successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
