import { Response } from 'express';
import { z } from 'zod';
import { ExpenseService } from '../services/expense.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category ID is required'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  shopId: z.string().optional(),
});

export class ExpenseController {
  static async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const categories = await ExpenseService.getCategories(businessId);
      return ApiResponse.success(res, categories, 'Expense categories retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const category = await ExpenseService.createCategory(businessId, req.body.name);
      return ApiResponse.success(res, category, 'Expense category created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const category = await ExpenseService.updateCategory(businessId, id, req.body.name);
      return ApiResponse.success(res, category, 'Expense category updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await ExpenseService.deleteCategory(businessId, id);
      return ApiResponse.success(res, null, 'Expense category deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getExpenses(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId, categoryId, startDate, endDate } = req.query;
      const data = await ExpenseService.getExpenses(
        businessId,
        shopId as string,
        categoryId as string,
        startDate as string,
        endDate as string
      );
      return ApiResponse.success(res, data, 'Expenses retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const shopId = req.body.shopId || req.user?.shopId || null;
      const userId = req.user?.userId;

      if (!businessId || !userId) {
        return ApiResponse.error(res, 'User business context missing', 400);
      }

      const expense = await ExpenseService.createExpense(businessId, shopId, userId, req.body);
      return ApiResponse.success(res, expense, 'Expense recorded successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await ExpenseService.deleteExpense(id, businessId);
      return ApiResponse.success(res, null, 'Expense deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
