import { prisma } from '../config/db';
import { PurchaseOrderStatus } from '@prisma/client';

export class PurchaseService {
  // Supplier Management
  static async getSuppliers(businessId: string, search?: string) {
    const where: any = { businessId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createSupplier(
    businessId: string,
    dto: { name: string; contactPerson?: string; email?: string; phone?: string; address?: string }
  ) {
    return prisma.supplier.create({
      data: {
        name: dto.name,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        businessId,
      },
    });
  }

  static async updateSupplier(
    supplierId: string,
    businessId: string,
    dto: { name?: string; contactPerson?: string; email?: string; phone?: string; address?: string }
  ) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, businessId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return prisma.supplier.update({
      where: { id: supplierId },
      data: dto,
    });
  }

  static async deleteSupplier(supplierId: string, businessId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, businessId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return prisma.supplier.delete({
      where: { id: supplierId },
    });
  }

  // Purchase Order Management
  static async getPurchaseOrders(businessId: string, shopId?: string, status?: string) {
    const where: any = { businessId };
    if (shopId) where.shopId = shopId;
    if (status) where.status = status as PurchaseOrderStatus;

    return prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        shop: { select: { name: true } },
        user: { select: { fullName: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getPurchaseOrderById(orderId: string, businessId: string) {
    const order = await prisma.purchaseOrder.findFirst({
      where: { id: orderId, businessId },
      include: {
        supplier: true,
        shop: true,
        user: { select: { fullName: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new Error('Purchase order not found');
    }

    return order;
  }

  static async createPurchaseOrder(
    businessId: string,
    shopId: string,
    userId: string,
    dto: {
      supplierId: string;
      items: { productId: string; quantity: number; unitCost: number }[];
      notes?: string;
    }
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Purchase order must contain at least one item');
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: dto.supplierId, businessId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    let totalAmount = 0;
    const preparedItems = [];

    for (const item of dto.items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, businessId, deletedAt: null },
      });

      if (!product) {
        throw new Error(`Product not found (ID: ${item.productId})`);
      }

      const totalCost = item.quantity * item.unitCost;
      totalAmount += totalCost;

      preparedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost,
      });
    }

    const orderNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    return prisma.purchaseOrder.create({
      data: {
        orderNumber,
        totalAmount,
        status: PurchaseOrderStatus.PENDING,
        notes: dto.notes,
        supplierId: dto.supplierId,
        businessId,
        shopId,
        userId,
        items: {
          create: preparedItems,
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
  }

  static async receivePurchaseOrder(orderId: string, businessId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findFirst({
        where: { id: orderId, businessId, status: PurchaseOrderStatus.PENDING },
        include: { items: true },
      });

      if (!order) {
        throw new Error('Pending purchase order not found or already processed');
      }

      // Increment product stock in branch ProductStock for each item
      for (const item of order.items) {
        if (item.productId) {
          const stock = await tx.productStock.findFirst({
            where: { productId: item.productId, shopId: order.shopId },
          });

          const currentQty = stock ? stock.quantity : 0;
          const newQty = currentQty + item.quantity;

          if (stock) {
            await tx.productStock.update({
              where: { id: stock.id },
              data: { quantity: newQty },
            });
          } else {
            await tx.productStock.create({
              data: {
                productId: item.productId,
                shopId: order.shopId,
                quantity: newQty,
              },
            });
          }

          // Update product costPrice using Moving Weighted Average Cost (AVCO)
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            const currentCost = product.costPrice ? Number(product.costPrice) : 0;
            const receivedCost = Number(item.unitCost);
            const receivedQty = item.quantity;

            let newCostPrice = receivedCost;
            if (currentQty > 0 && currentCost > 0) {
              newCostPrice = ((currentQty * currentCost) + (receivedQty * receivedCost)) / (currentQty + receivedQty);
            }

            await tx.product.update({
              where: { id: item.productId },
              data: { costPrice: Math.round(newCostPrice * 100) / 100 },
            });
          }

          await tx.stockHistory.create({
            data: {
              productId: item.productId,
              shopId: order.shopId,
              userId,
              changeQty: item.quantity,
              newQty,
              reason: 'PURCHASE_RECEIVE',
              notes: `Goods received for PO #${order.orderNumber} @ KSh ${Number(item.unitCost).toLocaleString()}/unit`,
            },
          });
        }
      }

      return tx.purchaseOrder.update({
        where: { id: orderId },
        data: { status: PurchaseOrderStatus.RECEIVED },
        include: {
          supplier: true,
          items: { include: { product: true } },
        },
      });
    });
  }
}
