import { prisma } from '../config/db';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionService {
  static async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
  }

  static async getAllPlans() {
    return prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  static async updatePlan(
    planId: string,
    data: { name?: string; price?: number; maxShops?: number; active?: boolean }
  ) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    return prisma.subscriptionPlan.update({
      where: { id: planId },
      data,
    });
  }

  static async getCurrentSubscription(businessId: string) {
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId },
      include: {
        plan: true,
        business: {
          select: {
            name: true,
            _count: {
              select: {
                shops: { where: { deletedAt: null } },
                users: true,
                products: { where: { deletedAt: null } },
              },
            },
          },
        },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new Error('Subscription details not found for this business');
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isExpired = now > endDate;

    return {
      subscription,
      status: isExpired ? SubscriptionStatus.EXPIRED : subscription.status,
      daysRemaining,
      isExpired,
      usage: {
        currentShops: subscription.business._count.shops,
        maxShops: subscription.plan.maxShops,
        currentUsers: subscription.business._count.users,
        currentProducts: subscription.business._count.products,
      },
    };
  }

  static async upgradeSubscription(
    businessId: string,
    planCode: string,
    paymentMethod: string,
    transactionRef?: string
  ) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode.toUpperCase() },
    });

    if (!plan) {
      throw new Error(`Subscription plan '${planCode}' not found`);
    }

    return prisma.$transaction(async (tx) => {
      const existingSub = await tx.businessSubscription.findUnique({
        where: { businessId },
      });

      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 30); // 30 days validity

      let subscription;

      if (existingSub) {
        subscription = await tx.businessSubscription.update({
          where: { businessId },
          data: {
            planId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            startDate: new Date(),
            endDate: newEndDate,
          },
        });
      } else {
        subscription = await tx.businessSubscription.create({
          data: {
            businessId,
            planId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            startDate: new Date(),
            endDate: newEndDate,
          },
        });
      }

      // Record Payment
      if (Number(plan.price) > 0) {
        await tx.subscriptionPayment.create({
          data: {
            businessSubscriptionId: subscription.id,
            amount: plan.price,
            paymentMethod,
            transactionRef,
            status: 'COMPLETED',
          },
        });
      }

      return {
        subscription,
        plan,
        message: `Successfully subscribed to ${plan.name}`,
      };
    });
  }

  // SuperAdmin Platform Operations
  static async getTenants(search?: string, statusFilter?: SubscriptionStatus) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (statusFilter) {
      where.subscription = { status: statusFilter };
    }

    return prisma.business.findMany({
      where,
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: {
            shops: { where: { deletedAt: null } },
            users: true,
            products: { where: { deletedAt: null } },
            sales: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async suspendTenant(businessId: string) {
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId },
    });

    if (!subscription) {
      throw new Error('Tenant subscription not found');
    }

    return prisma.businessSubscription.update({
      where: { businessId },
      data: { status: SubscriptionStatus.CANCELLED },
    });
  }

  static async reactivateTenant(businessId: string) {
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId },
    });

    if (!subscription) {
      throw new Error('Tenant subscription not found');
    }

    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + 30);

    return prisma.businessSubscription.update({
      where: { businessId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        endDate: newEndDate,
      },
    });
  }

  static async extendTrial(businessId: string, extraDays: number) {
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId },
    });

    if (!subscription) {
      throw new Error('Business subscription not found');
    }

    const currentEndDate = new Date(subscription.endDate);
    const newEndDate = new Date(currentEndDate.getTime() + extraDays * 24 * 60 * 60 * 1000);

    return prisma.businessSubscription.update({
      where: { businessId },
      data: {
        endDate: newEndDate,
        status: SubscriptionStatus.TRIALING,
      },
      include: { plan: true },
    });
  }

  static async getPlatformRevenue(startDate?: string, endDate?: string) {
    const where: any = { status: 'COMPLETED' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await prisma.subscriptionPayment.findMany({
      where,
      include: {
        subscription: {
          include: {
            business: { select: { name: true, email: true } },
            plan: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalRevenue,
      totalPaymentsCount: payments.length,
      payments,
    };
  }
}
