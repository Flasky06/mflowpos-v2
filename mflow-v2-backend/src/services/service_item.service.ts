import { prisma } from '../config/db';

export class ServiceItemService {
  static async getServices(businessId: string, shopId?: string, categoryId?: string, search?: string) {
    const where: any = {
      businessId,
      deletedAt: null,
    };

    if (shopId) where.shopId = shopId;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.service.findMany({
      where,
      include: {
        category: true,
        shop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getServiceById(id: string, businessId: string) {
    const service = await prisma.service.findFirst({
      where: { id, businessId, deletedAt: null },
      include: { category: true, shop: true },
    });

    if (!service) {
      throw new Error('Service item not found');
    }

    return service;
  }

  static async createService(
    businessId: string,
    data: {
      name: string;
      price: number;
      costPrice?: number;
      description?: string;
      code?: string;
      unit?: string;
      categoryId?: string;
      shopId?: string;
    },
    userId?: string
  ) {
    const generatedCode = data.code || `SRV-${Date.now()}`;

    return prisma.service.create({
      data: {
        name: data.name,
        price: data.price,
        costPrice: data.costPrice,
        description: data.description,
        code: generatedCode,
        unit: data.unit || 'service',
        categoryId: data.categoryId,
        businessId,
        shopId: data.shopId,
        createdBy: userId,
        updatedBy: userId,
      },
      include: { category: true, shop: true },
    });
  }

  static async updateService(
    id: string,
    businessId: string,
    data: {
      name?: string;
      price?: number;
      costPrice?: number;
      description?: string;
      code?: string;
      unit?: string;
      categoryId?: string;
      shopId?: string;
    },
    userId?: string
  ) {
    const service = await prisma.service.findFirst({
      where: { id, businessId, deletedAt: null },
    });

    if (!service) {
      throw new Error('Service item not found');
    }

    return prisma.service.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: { category: true, shop: true },
    });
  }

  static async deleteService(id: string, businessId: string, userId?: string) {
    const service = await prisma.service.findFirst({
      where: { id, businessId, deletedAt: null },
    });

    if (!service) {
      throw new Error('Service item not found');
    }

    return prisma.service.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // Service Category methods
  static async getCategories(businessId: string) {
    return prisma.serviceCategory.findMany({
      where: { businessId },
      include: { _count: { select: { services: true } } },
    });
  }

  static async createCategory(businessId: string, name: string, userId?: string) {
    return prisma.serviceCategory.create({
      data: {
        name,
        businessId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }
}
