import { Response } from 'express';
import { ReportService } from '../services/report.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class ReportController {
  static async getDashboardSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId, startDate, endDate, itemType } = req.query;
      const summary = await ReportService.getDashboardSummary(
        businessId,
        shopId as string,
        startDate as string,
        endDate as string,
        itemType as 'PRODUCTS_ONLY' | 'SERVICES_ONLY' | 'BOTH'
      );
      return ApiResponse.success(res, summary, 'Dashboard summary retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getTopSellingProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId, limit, startDate, endDate, itemType } = req.query;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 10;

      const topItems = await ReportService.getTopSellingItems(
        businessId,
        shopId as string,
        parsedLimit,
        startDate as string,
        endDate as string,
        (itemType as any) || 'BOTH'
      );
      return ApiResponse.success(res, topItems, 'Top selling items retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getInventoryValuation(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const { shopId } = req.query;
      const valuation = await ReportService.getInventoryValuation(businessId, shopId as string);
      return ApiResponse.success(res, valuation, 'Inventory valuation retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
