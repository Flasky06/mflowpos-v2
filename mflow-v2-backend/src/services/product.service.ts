import { prisma } from '../config/db';

export class ProductService {
  static async getProducts(businessId: string, shopId?: string, search?: string, categoryId?: string) {
    const where: any = {
      businessId,
      deletedAt: null,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.product.findMany({
      where,
      include: {
        category: true,
        stocks: shopId
          ? { where: { shopId } }
          : { include: { shop: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getProductById(productId: string, businessId: string, shopId?: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, businessId, deletedAt: null },
      include: {
        category: true,
        stocks: shopId
          ? { where: { shopId }, include: { shop: true } }
          : { include: { shop: true } },
        stockHistory: {
          where: shopId ? { shopId } : undefined,
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { fullName: true, email: true } }, shop: { select: { name: true } } },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  static async createProduct(
    businessId: string,
    data: {
      name: string;
      sellingPrice: number;
      costPrice?: number;
      quantity?: number;
      minStockLevel?: number;
      sku?: string;
      barcode?: string;
      unit?: string;
      categoryId?: string;
      shopId?: string;
    },
    userId?: string
  ) {
    const generatedSku = data.sku || `SKU-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return prisma.$transaction(async (tx) => {
      // 1. Create Master Product in Business Catalog
      const product = await tx.product.create({
        data: {
          name: data.name,
          sellingPrice: data.sellingPrice,
          costPrice: data.costPrice,
          sku: generatedSku,
          barcode: data.barcode,
          unit: data.unit || 'pcs',
          categoryId: data.categoryId,
          businessId,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 2. Initialize Stock in Shop Inventory if shopId provided
      if (data.shopId) {
        const initialQty = data.quantity || 0;
        await tx.productStock.create({
          data: {
            productId: product.id,
            shopId: data.shopId,
            quantity: initialQty,
            minStockLevel: data.minStockLevel || 5,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        if (initialQty > 0) {
          await tx.stockHistory.create({
            data: {
              productId: product.id,
              shopId: data.shopId,
              userId,
              changeQty: initialQty,
              newQty: initialQty,
              reason: 'INITIAL_RESTOCK',
              notes: 'Initial stock allocated on product creation',
              createdBy: userId,
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { category: true, stocks: true },
      });
    });
  }

  static async updateProduct(
    productId: string,
    businessId: string,
    data: {
      name?: string;
      sellingPrice?: number;
      costPrice?: number;
      sku?: string;
      barcode?: string;
      unit?: string;
      categoryId?: string;
    },
    userId?: string
  ) {
    const product = await prisma.product.findFirst({
      where: { id: productId, businessId, deletedAt: null },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: { category: true, stocks: true },
    });
  }

  static async adjustStock(
    productId: string,
    shopId: string,
    businessId: string,
    changeQty: number,
    reason: string,
    notes?: string,
    userId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, businessId, deletedAt: null },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const existingStock = await tx.productStock.findUnique({
        where: { productId_shopId: { productId, shopId } },
      });

      const currentQty = existingStock ? existingStock.quantity : 0;
      const newQty = currentQty + changeQty;

      if (newQty < 0) {
        throw new Error(`Insufficient stock for branch. Current: ${currentQty}, Requested change: ${changeQty}`);
      }

      const updatedStock = await tx.productStock.upsert({
        where: { productId_shopId: { productId, shopId } },
        create: {
          productId,
          shopId,
          quantity: newQty,
          minStockLevel: 5,
          createdBy: userId,
          updatedBy: userId,
        },
        update: {
          quantity: newQty,
          updatedBy: userId,
        },
      });

      await tx.stockHistory.create({
        data: {
          productId,
          shopId,
          userId,
          changeQty,
          newQty,
          reason: reason || 'MANUAL_ADJUSTMENT',
          notes,
          createdBy: userId,
        },
      });

      return updatedStock;
    });
  }

  static async deleteProduct(productId: string, businessId: string, userId?: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, businessId, deletedAt: null },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // Product Category methods
  static async getCategories(businessId: string) {
    return prisma.productCategory.findMany({
      where: { businessId },
      include: { _count: { select: { products: true } } },
    });
  }

  static async createCategory(businessId: string, name: string, userId?: string) {
    return prisma.productCategory.create({
      data: {
        name,
        businessId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async updateCategory(categoryId: string, businessId: string, name: string, userId?: string) {
    const category = await prisma.productCategory.findFirst({
      where: { id: categoryId, businessId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        name,
        updatedBy: userId,
      },
    });
  }

  static async deleteCategory(categoryId: string, businessId: string) {
    const category = await prisma.productCategory.findFirst({
      where: { id: categoryId, businessId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Set product categoryId to null for associated products before deleting category
    await prisma.product.updateMany({
      where: { categoryId, businessId },
      data: { categoryId: null },
    });

    return prisma.productCategory.delete({
      where: { id: categoryId },
    });
  }
}
