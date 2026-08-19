import { Response } from 'express';
import { z } from 'zod';
import { ProductService } from '../services/product.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product or Service name is required'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  costPrice: z.number().optional(),
  isService: z.boolean().optional(),
  quantity: z.number().int().nonnegative().optional(),
  minStockLevel: z.number().int().nonnegative().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().optional(),
  categoryId: z.string().optional(),
  shopId: z.string().optional(),
});

export const adjustStockSchema = z.object({
  shopId: z.string().optional(),
  changeQty: z.number().int(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

export class ProductController {
  static async getProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId, search, categoryId, isService } = req.query;
      const parsedIsService = isService === 'true' ? true : isService === 'false' ? false : undefined;

      const products = await ProductService.getProducts(
        businessId,
        shopId as string,
        search as string,
        categoryId as string
      );
      return ApiResponse.success(res, products, 'Products and services retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getProductById(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const product = await ProductService.getProductById(id, businessId);
      return ApiResponse.success(res, product, 'Item details retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 404);
    }
  }

  static async createProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const product = await ProductService.createProduct(businessId, req.body, req.user?.userId);
      return ApiResponse.success(res, product, 'Product or service created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const updated = await ProductService.updateProduct(id, businessId, req.body, req.user?.userId);
      return ApiResponse.success(res, updated, 'Item updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async adjustStock(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const targetShopId = req.body.shopId || req.user?.shopId;
      if (!targetShopId) return ApiResponse.error(res, 'Branch (Shop ID) required for stock adjustment', 400);

      const updated = await ProductService.adjustStock(
        id,
        targetShopId,
        businessId,
        Number(req.body.changeQty),
        req.body.reason,
        req.body.notes,
        req.user?.userId
      );
      return ApiResponse.success(res, updated, 'Stock adjusted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await ProductService.deleteProduct(id, businessId, req.user?.userId);
      return ApiResponse.success(res, null, 'Item deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const categories = await ProductService.getCategories(businessId);
      return ApiResponse.success(res, categories, 'Categories retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const category = await ProductService.createCategory(businessId, req.body.name, req.user?.userId);
      return ApiResponse.success(res, category, 'Category created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const category = await ProductService.updateCategory(id, businessId, req.body.name, req.user?.userId);
      return ApiResponse.success(res, category, 'Category updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await ProductService.deleteCategory(id, businessId);
      return ApiResponse.success(res, null, 'Category deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
