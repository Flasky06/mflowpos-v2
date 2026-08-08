import { Response } from 'express';
import { z } from 'zod';
import { CustomerService } from '../services/customer.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

export const payDebtSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
});

export class CustomerController {
  static async getCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { search } = req.query;
      const customers = await CustomerService.getCustomers(businessId, search as string);
      return ApiResponse.success(res, customers, 'Customers retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getCustomerById(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const customer = await CustomerService.getCustomerById(id, businessId);
      return ApiResponse.success(res, customer, 'Customer details retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 404);
    }
  }

  static async createCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const customer = await CustomerService.createCustomer(businessId, req.body);
      return ApiResponse.success(res, customer, 'Customer created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const customer = await CustomerService.updateCustomer(id, businessId, req.body);
      return ApiResponse.success(res, customer, 'Customer updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async payDebt(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const result = await CustomerService.payDebt(
        id,
        businessId,
        req.body.amount,
        req.body.paymentMethod,
        req.body.notes
      );
      return ApiResponse.success(res, result, 'Customer debt payment processed successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await CustomerService.deleteCustomer(id, businessId);
      return ApiResponse.success(res, null, 'Customer deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
