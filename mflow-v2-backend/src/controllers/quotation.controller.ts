import { Response } from 'express';
import { z } from 'zod';
import { QuotationService } from '../services/quotation.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createQuotationSchema = z.object({
  shopId: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().positive('Quantity must be positive'),
      unitPrice: z.number().positive('Unit price must be positive'),
    })
  ).min(1, 'Quotation must contain at least one item'),
  customerId: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const convertQuotationSchema = z.object({
  payments: z.array(
    z.object({
      paymentMethod: z.string().min(1, 'Payment method is required'),
      amount: z.number().positive('Amount must be positive'),
    })
  ).min(1, 'Payment method required'),
});

export class QuotationController {
  static async createQuotation(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const shopId = req.body.shopId || req.user?.shopId;
      const userId = req.user?.userId;

      if (!businessId || !shopId || !userId) {
        return ApiResponse.error(res, 'Branch/Shop context missing (ensure an active branch is selected)', 400);
      }

      const quotation = await QuotationService.createQuotation(businessId, shopId, userId, req.body);
      return ApiResponse.success(res, quotation, 'Quotation created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getQuotations(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId } = req.query;
      const quotations = await QuotationService.getQuotations(businessId, shopId as string);
      return ApiResponse.success(res, quotations, 'Quotations retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getQuotationById(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const quotation = await QuotationService.getQuotationById(id, businessId);
      return ApiResponse.success(res, quotation, 'Quotation details retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 404);
    }
  }

  static async convertToSale(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!businessId || !userId) return ApiResponse.error(res, 'Context missing', 400);

      const result = await QuotationService.convertToSale(id, businessId, userId, req.body.payments);
      return ApiResponse.success(res, result, 'Quotation converted to sale successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
