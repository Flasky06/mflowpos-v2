import { prisma } from '../config/db';

export class NotificationService {
  static async getTenantNotifications(businessId: string) {
    return prisma.businessNotification.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getUnreadCount(businessId: string) {
    const count = await prisma.businessNotification.count({
      where: { businessId, read: false },
    });
    return { unreadCount: count };
  }

  static async markAsRead(notificationId: string, businessId: string) {
    const notification = await prisma.businessNotification.findFirst({
      where: { id: notificationId, businessId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.businessNotification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
  }

  static async markAllAsRead(businessId: string) {
    return prisma.businessNotification.updateMany({
      where: { businessId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  static async deleteNotification(notificationId: string, businessId: string) {
    const notification = await prisma.businessNotification.findFirst({
      where: { id: notificationId, businessId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.businessNotification.delete({
      where: { id: notificationId },
    });
  }
}
