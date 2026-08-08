import { prisma } from '../config/db';
import { StockTransferStatus } from '@prisma/client';

export interface TransferItemDTO {
  productId: string;
  quantity: number;
}

export class StockTransferService {
  static async getTransfers(businessId: string, shopId?: string) {
    const where: any = { businessId };

    if (shopId) {
      where.OR = [{ sourceShopId: shopId }, { targetShopId: shopId }];
    }

    return prisma.stockTransfer.findMany({
      where,
      include: {
        sourceShop: { select: { name: true, location: true } },
        targetShop: { select: { name: true, location: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createTransfer(
    businessId: string,
    dto: {
      sourceShopId: string;
      targetShopId: string;
      items: TransferItemDTO[];
      notes?: string;
    },
    userId?: string
  ) {
    if (dto.sourceShopId === dto.targetShopId) {
      throw new Error('Source shop and target shop cannot be the same');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('Transfer must include at least one product item');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Verify Shops belong to Business
      const sourceShop = await tx.shop.findFirst({
        where: { id: dto.sourceShopId, businessId, deletedAt: null },
      });

      const targetShop = await tx.shop.findFirst({
        where: { id: dto.targetShopId, businessId, deletedAt: null },
      });

      if (!sourceShop || !targetShop) {
        throw new Error('Source shop or target shop not found');
      }

      const preparedItems = [];

      // 2. Validate and adjust stock levels
      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, businessId, deletedAt: null },
        });

        if (!product) {
          throw new Error(`Product not found (ID: ${item.productId})`);
        }

        // Check Source Shop Stock
        const sourceStock = await tx.productStock.findUnique({
          where: { productId_shopId: { productId: product.id, shopId: dto.sourceShopId } },
        });

        const availableSourceQty = sourceStock ? sourceStock.quantity : 0;
        if (availableSourceQty < item.quantity) {
          throw new Error(
            `Insufficient stock for '${product.name}' at ${sourceShop.name}. Available: ${availableSourceQty}, Requested: ${item.quantity}`
          );
        }

        const newSourceQty = availableSourceQty - item.quantity;

        // Decrement Source Shop Stock
        await tx.productStock.update({
          where: { productId_shopId: { productId: product.id, shopId: dto.sourceShopId } },
          data: { quantity: newSourceQty, updatedBy: userId },
        });

        // Audit Log Source Shop
        await tx.stockHistory.create({
          data: {
            productId: product.id,
            shopId: dto.sourceShopId,
            userId,
            changeQty: -item.quantity,
            newQty: newSourceQty,
            reason: 'TRANSFER_OUT',
            notes: `Transfer to ${targetShop.name}`,
            createdBy: userId,
          },
        });

        // Increment Target Shop Stock
        const targetStock = await tx.productStock.findUnique({
          where: { productId_shopId: { productId: product.id, shopId: dto.targetShopId } },
        });

        const currentTargetQty = targetStock ? targetStock.quantity : 0;
        const newTargetQty = currentTargetQty + item.quantity;

        await tx.productStock.upsert({
          where: { productId_shopId: { productId: product.id, shopId: dto.targetShopId } },
          create: {
            productId: product.id,
            shopId: dto.targetShopId,
            quantity: item.quantity,
            minStockLevel: 5,
            createdBy: userId,
            updatedBy: userId,
          },
          update: {
            quantity: newTargetQty,
            updatedBy: userId,
          },
        });

        // Audit Log Target Shop
        await tx.stockHistory.create({
          data: {
            productId: product.id,
            shopId: dto.targetShopId,
            userId,
            changeQty: item.quantity,
            newQty: newTargetQty,
            reason: 'TRANSFER_IN',
            notes: `Transfer from ${sourceShop.name}`,
            createdBy: userId,
          },
        });

        preparedItems.push({
          productId: product.id,
          quantity: item.quantity,
        });
      }

      const transferNumber = `TRF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      // 3. Create StockTransfer Record
      return tx.stockTransfer.create({
        data: {
          transferNumber,
          sourceShopId: dto.sourceShopId,
          targetShopId: dto.targetShopId,
          businessId,
          status: StockTransferStatus.COMPLETED,
          notes: dto.notes,
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: preparedItems,
          },
        },
        include: {
          sourceShop: { select: { name: true } },
          targetShop: { select: { name: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
      });
    });
  }
}
