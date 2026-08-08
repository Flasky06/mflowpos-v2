import { prisma } from '../config/db';
import { ShopType } from '@prisma/client';

export class BusinessService {
  static async getBusinessProfile(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        shops: {
          where: { deletedAt: null },
        },
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!business) {
      throw new Error('Business profile not found');
    }

    return business;
  }

  static async updateBusinessProfile(businessId: string, data: { name?: string; email?: string; phone?: string; currency?: string; address?: string }) {
    return prisma.business.update({
      where: { id: businessId },
      data,
    });
  }

  static async getShops(businessId: string) {
    return prisma.shop.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
    });
  }

  static async createShop(
    businessId: string,
    data: { name: string; location?: string; phone?: string; shopType?: ShopType },
    userId?: string
  ) {
    // Enforce Plan Shop Limit
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId },
      include: { plan: true },
    });

    if (subscription) {
      const currentShopCount = await prisma.shop.count({
        where: { businessId, deletedAt: null },
      });

      if (currentShopCount >= subscription.plan.maxShops) {
        throw new Error(
          `Shop creation limit reached for your active plan '${subscription.plan.name}'. Maximum allowed shops: ${subscription.plan.maxShops}. Please upgrade your subscription plan.`
        );
      }
    }

    return prisma.shop.create({
      data: {
        name: data.name,
        location: data.location,
        phone: data.phone,
        shopType: data.shopType || ShopType.BOTH,
        businessId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async updateShop(
    shopId: string,
    businessId: string,
    data: { name?: string; location?: string; phone?: string; shopType?: ShopType },
    userId?: string
  ) {
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, businessId, deletedAt: null },
    });

    if (!shop) {
      throw new Error('Shop branch not found');
    }

    return prisma.shop.update({
      where: { id: shopId },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  static async deleteShop(shopId: string, businessId: string, userId?: string) {
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, businessId, deletedAt: null },
    });

    if (!shop) {
      throw new Error('Shop branch not found');
    }

    // Soft Delete
    return prisma.shop.update({
      where: { id: shopId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }
}
