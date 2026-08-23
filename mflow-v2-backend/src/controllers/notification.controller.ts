import { Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const notifications = await NotificationService.getTenantNotifications(businessId);
      return ApiResponse.success(res, notifications, 'Notifications retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const countData = await NotificationService.getUnreadCount(businessId);
      return ApiResponse.success(res, countData, 'Unread count retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      const updated = await NotificationService.markAsRead(id, businessId);
      return ApiResponse.success(res, updated, 'Notification marked as read');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await NotificationService.markAllAsRead(businessId);
      return ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const { id } = req.params;
      if (!businessId) return ApiResponse.error(res, 'Business ID required', 400);

      await NotificationService.deleteNotification(id, businessId);
      return ApiResponse.success(res, null, 'Notification deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
