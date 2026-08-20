import { Response } from 'express';
import { z } from 'zod';
import { PaymentAccountService } from '../services/payment_account.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createPaymentAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.string().min(1, 'Account type is required'), // CASH, MPESA, BANK, CARD, CREDIT, OTHER
  accountNumber: z.string().optional(),
  description: z.string().optional(),
  shopId: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export class PaymentAccountController {
  static async getPaymentAccounts(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId } = req.query;
      const accounts = await PaymentAccountService.getPaymentAccounts(businessId, shopId as string);
      return ApiResponse.success(res, accounts, 'Payment accounts retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createPaymentAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const account = await PaymentAccountService.createPaymentAccount(businessId, req.body, req.user?.userId);
      return ApiResponse.success(res, account, 'Payment account created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updatePaymentAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const account = await PaymentAccountService.updatePaymentAccount(id, businessId, req.body, req.user?.userId);
      return ApiResponse.success(res, account, 'Payment account updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deletePaymentAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await PaymentAccountService.deletePaymentAccount(id, businessId);
      return ApiResponse.success(res, null, 'Payment account deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
