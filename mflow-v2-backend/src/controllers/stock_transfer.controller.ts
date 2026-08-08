import { Response } from 'express';
import { z } from 'zod';
import { StockTransferService } from '../services/stock_transfer.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createTransferSchema = z.object({
  sourceShopId: z.string().min(1, 'Source shop ID is required'),
  targetShopId: z.string().min(1, 'Target shop ID is required'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().positive('Quantity must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

export class StockTransferController {
  static async getTransfers(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId } = req.query;
      const transfers = await StockTransferService.getTransfers(businessId, shopId as string);
      return ApiResponse.success(res, transfers, 'Stock transfers retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createTransfer(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const userId = req.user?.userId;
      if (!businessId || !userId) return ApiResponse.error(res, 'Authentication required', 400);

      const transfer = await StockTransferService.createTransfer(businessId, req.body, userId);
      return ApiResponse.success(res, transfer, 'Stock transfer completed successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
