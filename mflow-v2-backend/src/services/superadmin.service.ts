import { prisma } from '../config/db';
import { PasswordUtil } from '../utils/password.util';
import { Role, SubscriptionStatus } from '@prisma/client';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';

export class SuperAdminService {
  // 1. Platform Overview KPI Analytics
  static async getPlatformStats() {
    const [
      totalBusinesses,
      totalUsers,
      totalShops,
      activeSubscribers,
      trialingBusinesses,
      revenueResult,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.user.count(),
      prisma.shop.count(),
      prisma.businessSubscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.businessSubscription.count({ where: { status: SubscriptionStatus.TRIALING } }),
      prisma.subscriptionPayment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
    ]);

    return {
      totalBusinesses,
      totalUsers,
      totalShops,
      activeSubscribers,
      trialingBusinesses,
      totalRevenue: revenueResult._sum.amount || 0,
    };
  }

  // 2. User Directory & Permissions Management
  static async getAllUsers(search?: string, role?: Role) {
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        customPermissions: true,
        businessId: true,
        shopId: true,
        createdAt: true,
        business: { select: { name: true } },
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateUserRole(userId: string, role: Role, customPermissions?: string[]) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        role,
        ...(customPermissions ? { customPermissions } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        customPermissions: true,
      },
    });
  }

  static async suspendUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { active: false },
      select: { id: true, fullName: true, email: true, active: true },
    });
  }

  static async reactivateUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { active: true },
      select: { id: true, fullName: true, email: true, active: true },
    });
  }

  static async resetUserPassword(userId: string, newPassword: string) {
    const hashedPassword = await PasswordUtil.hash(newPassword);
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true, fullName: true, email: true },
    });
  }

  static async deleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }

  // 3. Platform Business Management & Suspension
  static async getAllBusinesses() {
    return prisma.business.findMany({
      include: {
        users: { select: { id: true, email: true, fullName: true, role: true } },
        shops: { select: { id: true, name: true, shopType: true } },
        subscription: { include: { plan: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateBusiness(
    businessId: string,
    data: { name?: string; email?: string; phone?: string; currency?: string; active?: boolean }
  ) {
    return prisma.business.update({
      where: { id: businessId },
      data,
      include: { subscription: { include: { plan: true } } },
    });
  }

  static async toggleBusinessStatus(businessId: string, status?: string) {
    const newStatus = status === 'SUSPENDED' ? SubscriptionStatus.CANCELLED : SubscriptionStatus.ACTIVE;
    const isActive = newStatus === SubscriptionStatus.ACTIVE;

    return prisma.$transaction(async (tx) => {
      const business = await tx.business.update({
        where: { id: businessId },
        data: { active: isActive },
      });

      await tx.businessSubscription.updateMany({
        where: { businessId },
        data: { status: newStatus },
      });

      return business;
    });
  }

  static async extendBusinessTrial(businessId: string, days = 14) {
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId },
    });

    const currentEndDate = subscription?.endDate ? new Date(subscription.endDate) : new Date();
    currentEndDate.setDate(currentEndDate.getDate() + days);

    return prisma.businessSubscription.update({
      where: { businessId },
      data: {
        status: SubscriptionStatus.TRIALING,
        endDate: currentEndDate,
      },
    });
  }

  static async getAllPayments() {
    return prisma.subscriptionPayment.findMany({
      include: {
        subscription: { include: { business: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. Activate Cash / Manual Subscription Payment
  static async activateCashPayment(
    businessId: string,
    dto: {
      planCode: string;
      amount?: number;
      paymentMethod?: string;
      transactionRef?: string;
      validityMonths?: number;
    }
  ) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: dto.planCode.toUpperCase() },
    });

    if (!plan) {
      throw new Error(`Plan code '${dto.planCode}' not found`);
    }

    const months = dto.validityMonths || 1;
    const paymentAmount = dto.amount ?? Number(plan.price) * months;
    const paymentMethod = dto.paymentMethod || 'CASH';

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    return prisma.$transaction(async (tx) => {
      const subscription = await tx.businessSubscription.upsert({
        where: { businessId },
        create: {
          businessId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
        },
        update: {
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
        },
      });

      await tx.business.update({
        where: { id: businessId },
        data: { active: true },
      });

      const payment = await tx.subscriptionPayment.create({
        data: {
          businessSubscriptionId: subscription.id,
          amount: paymentAmount,
          paymentMethod,
          transactionRef: dto.transactionRef || `CASH-${Date.now()}`,
          status: 'COMPLETED',
        },
      });

      return {
        subscription,
        plan,
        payment,
        message: `Successfully activated ${plan.name} subscription via ${paymentMethod} for ${months} month(s)`,
      };
    });
  }

  // 5. Custom Subscription Plan Override
  static async overrideSubscription(
    businessId: string,
    planCode: string,
    daysValidity: number,
    status?: SubscriptionStatus
  ) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode.toUpperCase() },
    });

    if (!plan) {
      throw new Error(`Plan code '${planCode}' not found`);
    }

    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + daysValidity);

    return prisma.businessSubscription.upsert({
      where: { businessId },
      create: {
        businessId,
        planId: plan.id,
        status: status || SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: newEndDate,
      },
      update: {
        planId: plan.id,
        status: status || SubscriptionStatus.ACTIVE,
        endDate: newEndDate,
      },
      include: { plan: true, business: { select: { name: true } } },
    });
  }

  // 6. Update Custom Tenant Pricing Override (Custom amount per business tenant, e.g. KSh 1,000 vs KSh 1,500)
  static async updateTenantCustomPricing(
    businessId: string,
    customPrice: number | null,
    status?: SubscriptionStatus
  ) {
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId },
    });

    if (!subscription) {
      throw new Error('Business subscription not found');
    }

    return prisma.businessSubscription.update({
      where: { businessId },
      data: {
        customPrice: customPrice !== null && !isNaN(customPrice) ? customPrice : null,
        ...(status ? { status } : {}),
      },
      include: { plan: true, business: { select: { name: true } } },
    });
  }

  // 7. Admin Broadcast Messaging & Announcements (In-App Screen, Email, WhatsApp)
  static async sendBroadcastMessage(
    senderUserId: string,
    dto: {
      title: string;
      content: string;
      targetType: 'ALL_BUSINESSES' | 'SPECIFIC_BUSINESS' | 'ACTIVE_ONLY' | 'TRIALING_ONLY';
      businessId?: string;
      channels?: string[];
    }
  ) {
    const { title, content, targetType, businessId, channels = ['IN_APP'] } = dto;

    let targetBusinesses: any[] = [];
    if (targetType === 'SPECIFIC_BUSINESS' && businessId) {
      const b = await prisma.business.findUnique({
        where: { id: businessId },
        include: { users: { where: { role: { in: [Role.ADMIN, Role.SHOP_ADMIN] } } } },
      });
      if (b) targetBusinesses = [b];
    } else if (targetType === 'ACTIVE_ONLY') {
      targetBusinesses = await prisma.business.findMany({
        where: { subscription: { status: SubscriptionStatus.ACTIVE } },
        include: { users: { where: { role: { in: [Role.ADMIN, Role.SHOP_ADMIN] } } } },
      });
    } else if (targetType === 'TRIALING_ONLY') {
      targetBusinesses = await prisma.business.findMany({
        where: { subscription: { status: SubscriptionStatus.TRIALING } },
        include: { users: { where: { role: { in: [Role.ADMIN, Role.SHOP_ADMIN] } } } },
      });
    } else {
      targetBusinesses = await prisma.business.findMany({
        include: { users: { where: { role: { in: [Role.ADMIN, Role.SHOP_ADMIN] } } } },
      });
    }

    const broadcast = await prisma.broadcastMessage.create({
      data: {
        title,
        content,
        targetType: targetType as any,
        businessId: targetType === 'SPECIFIC_BUSINESS' ? businessId : null,
        channels,
        sentBy: senderUserId,
      },
    });

    const isInApp = channels.includes('IN_APP');
    const isEmail = channels.includes('EMAIL');
    const isWhatsApp = channels.includes('WHATSAPP');

    for (const b of targetBusinesses) {
      if (isInApp) {
        await prisma.businessNotification.create({
          data: {
            businessId: b.id,
            broadcastMessageId: broadcast.id,
            title,
            content,
          },
        });
      }

      if (isEmail && b.email) {
        EmailService.sendBroadcastEmail(b.email, title, content);
      }

      if (isWhatsApp && b.phone) {
        WhatsAppService.sendMessage(b.phone, `*${title}*\n\n${content}`);
      }
    }

    return {
      broadcast,
      recipientCount: targetBusinesses.length,
      message: `Broadcast message sent to ${targetBusinesses.length} business(es)`,
    };
  }

  static async getBroadcastMessages() {
    return prisma.broadcastMessage.findMany({
      include: {
        business: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async deleteBroadcastMessage(id: string) {
    return prisma.broadcastMessage.delete({
      where: { id },
    });
  }
}
