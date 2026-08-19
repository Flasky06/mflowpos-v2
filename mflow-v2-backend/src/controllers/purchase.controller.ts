import { Response } from 'express';
import { z } from 'zod';
import { PurchaseService } from '../services/purchase.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const createPurchaseOrderSchema = z.object({
  shopId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().positive('Quantity must be positive'),
      unitCost: z.number().positive('Unit cost must be positive'),
    })
  ).min(1, 'Purchase order must contain at least one item'),
  notes: z.string().optional(),
});

export class PurchaseController {
  // Suppliers
  static async getSuppliers(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { search } = req.query;
      const suppliers = await PurchaseService.getSuppliers(businessId, search as string);
      return ApiResponse.success(res, suppliers, 'Suppliers retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async createSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const supplier = await PurchaseService.createSupplier(businessId, req.body);
      return ApiResponse.success(res, supplier, 'Supplier created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async updateSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const supplier = await PurchaseService.updateSupplier(id, businessId, req.body);
      return ApiResponse.success(res, supplier, 'Supplier updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await PurchaseService.deleteSupplier(id, businessId);
      return ApiResponse.success(res, null, 'Supplier deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  // Purchase Orders
  static async getPurchaseOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId, status } = req.query;
      const orders = await PurchaseService.getPurchaseOrders(businessId, shopId as string, status as string);
      return ApiResponse.success(res, orders, 'Purchase orders retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getPurchaseOrderById(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const order = await PurchaseService.getPurchaseOrderById(id, businessId);
      return ApiResponse.success(res, order, 'Purchase order details retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 404);
    }
  }

  static async createPurchaseOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const shopId = req.body.shopId || req.user?.shopId;
      const userId = req.user?.userId;

      if (!businessId || !shopId || !userId) {
        return ApiResponse.error(res, 'Branch/Shop context missing (ensure an active branch is selected)', 400);
      }

      const order = await PurchaseService.createPurchaseOrder(businessId, shopId, userId, req.body);
      return ApiResponse.success(res, order, 'Purchase order created successfully', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async receivePurchaseOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!businessId || !userId) return ApiResponse.error(res, 'User context missing', 400);

      const order = await PurchaseService.receivePurchaseOrder(id, businessId, userId);
      return ApiResponse.success(res, order, 'Purchase order received and stock restocked successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
