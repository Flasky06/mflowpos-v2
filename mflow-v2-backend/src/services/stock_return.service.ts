import { prisma } from '../config/db';
import { StockReturnType } from '@prisma/client';

export class StockReturnService {
  static async getStockReturns(businessId: string, shopId?: string) {
    const where: any = { businessId };
    if (shopId) where.shopId = shopId;

    return prisma.stockReturn.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createStockReturn(
    businessId: string,
    dto: {
      productId: string;
      shopId: string;
      quantity: number;
      returnType?: StockReturnType;
      reason: string;
      notes?: string;
    },
    userId?: string
  ) {
    if (dto.quantity <= 0) {
      throw new Error('Return quantity must be greater than zero');
    }

    const returnType = dto.returnType || StockReturnType.CUSTOMER_RETURN;

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: dto.productId, businessId, deletedAt: null },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const shop = await tx.shop.findFirst({
        where: { id: dto.shopId, businessId, deletedAt: null },
      });

      if (!shop) {
        throw new Error('Shop branch not found');
      }

      const existingStock = await tx.productStock.findUnique({
        where: { productId_shopId: { productId: dto.productId, shopId: dto.shopId } },
      });

      const currentQty = existingStock ? existingStock.quantity : 0;
      let changeQty = 0;

      if (returnType === StockReturnType.CUSTOMER_RETURN) {
        // Customer return restocks item back into inventory
        changeQty = dto.quantity;
      } else {
        // Supplier return or Damaged/Expired removes item from inventory
        if (currentQty < dto.quantity) {
          throw new Error(`Insufficient stock for return. Available: ${currentQty}, Requested return: ${dto.quantity}`);
        }
        changeQty = -dto.quantity;
      }

      const newQty = currentQty + changeQty;

      // Update ProductStock
      await tx.productStock.upsert({
        where: { productId_shopId: { productId: dto.productId, shopId: dto.shopId } },
        create: {
          productId: dto.productId,
          shopId: dto.shopId,
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

      // Audit Log in StockHistory
      await tx.stockHistory.create({
        data: {
          productId: dto.productId,
          shopId: dto.shopId,
          userId,
          changeQty,
          newQty,
          reason: `RETURN_${returnType}`,
          notes: dto.notes || dto.reason,
          createdBy: userId,
        },
      });

      const returnNumber = `RET-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      return tx.stockReturn.create({
        data: {
          returnNumber,
          returnType,
          productId: dto.productId,
          shopId: dto.shopId,
          businessId,
          quantity: dto.quantity,
          reason: dto.reason,
          notes: dto.notes,
          createdBy: userId,
        },
        include: {
          product: { select: { name: true, sku: true } },
          shop: { select: { name: true } },
        },
      });
    });
  }
}
