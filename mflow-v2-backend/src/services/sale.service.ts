import { prisma } from '../config/db';
import { SaleStatus, ServiceOrderStatus } from '@prisma/client';

export interface CreateSaleItemDTO {
  productId?: string;
  serviceId?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSalePaymentDTO {
  paymentMethod: string; // CASH, CARD, MPESA, CREDIT
  amount: number;
}

export class SaleService {
  static async createSale(
    businessId: string,
    shopId: string,
    userId: string,
    dto: {
      items: CreateSaleItemDTO[];
      payments: CreateSalePaymentDTO[];
      customerId?: string;
      serviceOrderStatus?: ServiceOrderStatus;
    }
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Sale must contain at least one product or service item');
    }

    if (!dto.payments || dto.payments.length === 0) {
      throw new Error('Sale must contain at least one payment method');
    }

    return prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let hasServiceItem = false;
      const preparedItems = [];

      // 1. Process cart items (Products or Services)
      for (const item of dto.items) {
        if (!item.productId && !item.serviceId) {
          throw new Error('Sale item must specify either productId or serviceId');
        }

        if (item.productId) {
          // Process Physical Product & Check Branch Stock
          const product = await tx.product.findFirst({
            where: { id: item.productId, businessId, deletedAt: null },
          });

          if (!product) {
            throw new Error(`Product not found (ID: ${item.productId})`);
          }

          const branchStock = await tx.productStock.findUnique({
            where: { productId_shopId: { productId: product.id, shopId } },
          });

          const currentStockQty = branchStock ? branchStock.quantity : 0;

          if (currentStockQty < item.quantity) {
            throw new Error(
              `Insufficient stock for '${product.name}' at branch. Available: ${currentStockQty}, Requested: ${item.quantity}`
            );
          }

          const newQty = currentStockQty - item.quantity;

          // Deduct stock directly for physical Products in this Shop
          await tx.productStock.update({
            where: { productId_shopId: { productId: product.id, shopId } },
            data: { quantity: newQty, updatedBy: userId },
          });

          // Log stock deduction in history for this Shop
          await tx.stockHistory.create({
            data: {
              productId: product.id,
              shopId,
              userId,
              changeQty: -item.quantity,
              newQty,
              reason: 'SALE',
              notes: 'POS Sale deduction',
              createdBy: userId,
            },
          });

          const itemTotal = item.quantity * item.unitPrice;
          totalAmount += itemTotal;

          preparedItems.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal,
          });
        } else if (item.serviceId) {
          // Process Non-Inventory Service (Laundry, Repairs, Tailoring, etc.)
          hasServiceItem = true;
          const service = await tx.service.findFirst({
            where: { id: item.serviceId, businessId, deletedAt: null },
          });

          if (!service) {
            throw new Error(`Service not found (ID: ${item.serviceId})`);
          }

          const itemTotal = item.quantity * item.unitPrice;
          totalAmount += itemTotal;

          preparedItems.push({
            serviceId: service.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal,
          });
        }
      }

      // Calculate total paid
      let paidAmount = 0;
      let creditAmount = 0;

      for (const pay of dto.payments) {
        paidAmount += pay.amount;
        if (pay.paymentMethod.toUpperCase() === 'CREDIT') {
          creditAmount += pay.amount;
        }
      }

      // 2. Handle Customer Credit Ledger
      if (creditAmount > 0) {
        if (!dto.customerId) {
          throw new Error('Customer ID is required for Credit / Pay Later sales');
        }

        await tx.customer.update({
          where: { id: dto.customerId },
          data: {
            outstandingBalance: {
              increment: creditAmount,
            },
          },
        });
      }

      const receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const initialServiceOrderStatus = hasServiceItem
        ? dto.serviceOrderStatus || ServiceOrderStatus.RECEIVED
        : undefined;

      // 3. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          receiptNumber,
          totalAmount,
          paidAmount,
          status: SaleStatus.COMPLETED,
          serviceOrderStatus: initialServiceOrderStatus,
          businessId,
          shopId,
          userId,
          customerId: dto.customerId,
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: preparedItems,
          },
          payments: {
            create: dto.payments.map((p) => ({
              paymentMethod: p.paymentMethod,
              amount: p.amount,
            })),
          },
        },
        include: {
          items: { include: { product: true, service: true } },
          payments: true,
          customer: true,
          shop: true,
          user: { select: { fullName: true, email: true } },
        },
      });

      // 4. Generate ESC/POS Thermal Printer Text Payload
      const receiptText = this.generateThermalReceipt(sale);

      return {
        sale,
        thermalReceiptPayload: receiptText,
      };
    });
  }

  static async updateServiceOrderStatus(saleId: string, businessId: string, status: ServiceOrderStatus, userId: string) {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, businessId },
    });

    if (!sale) {
      throw new Error('Transaction order not found');
    }

    return prisma.sale.update({
      where: { id: saleId },
      data: {
        serviceOrderStatus: status,
        updatedBy: userId,
      },
      include: {
        items: { include: { product: true, service: true } },
        customer: true,
      },
    });
  }

  static async getSales(businessId: string, shopId?: string, startDate?: string, endDate?: string, serviceOrderStatus?: ServiceOrderStatus) {
    const where: any = { businessId };

    if (shopId) {
      where.shopId = shopId;
    }

    if (serviceOrderStatus) {
      where.serviceOrderStatus = serviceOrderStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return prisma.sale.findMany({
      where,
      include: {
        items: { include: { product: true, service: true } },
        payments: true,
        customer: true,
        user: { select: { fullName: true } },
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getSaleById(saleId: string, businessId: string) {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, businessId },
      include: {
        items: { include: { product: true, service: true } },
        payments: true,
        customer: true,
        user: { select: { fullName: true } },
        shop: true,
      },
    });

    if (!sale) {
      throw new Error('Sale transaction not found');
    }

    return {
      sale,
      thermalReceiptPayload: this.generateThermalReceipt(sale),
    };
  }

  static async cancelSale(saleId: string, businessId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, businessId, status: SaleStatus.COMPLETED },
        include: { items: { include: { product: true, service: true } } },
      });

      if (!sale) {
        throw new Error('Completed sale not found or already cancelled');
      }

      // Restock physical products directly at the specific shop
      for (const item of sale.items) {
        if (item.productId && item.product) {
          const branchStock = await tx.productStock.findUnique({
            where: { productId_shopId: { productId: item.productId, shopId: sale.shopId } },
          });

          if (branchStock) {
            const newQty = branchStock.quantity + item.quantity;
            await tx.productStock.update({
              where: { productId_shopId: { productId: item.productId, shopId: sale.shopId } },
              data: { quantity: newQty, updatedBy: userId },
            });

            await tx.stockHistory.create({
              data: {
                productId: item.productId,
                shopId: sale.shopId,
                userId,
                changeQty: item.quantity,
                newQty,
                reason: 'SALE_CANCELLED',
                notes: `Restock from cancelled sale ${sale.receiptNumber}`,
                createdBy: userId,
              },
            });
          }
        }
      }

      // Revert customer debt balance if credit sale
      if (sale.customerId) {
        const unpaidAmount = Number(sale.totalAmount) - Number(sale.paidAmount);
        if (unpaidAmount > 0) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: {
              outstandingBalance: {
                decrement: unpaidAmount,
              },
            },
          });
        }
      }

      return tx.sale.update({
        where: { id: saleId },
        data: {
          status: SaleStatus.CANCELLED,
          serviceOrderStatus: ServiceOrderStatus.CANCELLED,
          updatedBy: userId,
        },
      });
    });
  }

  private static generateThermalReceipt(sale: any): string {
    const lines = [];
    lines.push('================================');
    lines.push('          RECEIPT               ');
    lines.push('================================');
    lines.push(`Receipt #: ${sale.receiptNumber}`);
    lines.push(`Date     : ${new Date(sale.createdAt).toLocaleString()}`);
    lines.push(`Cashier  : ${sale.user?.fullName || 'Staff'}`);
    if (sale.shop?.name) lines.push(`Branch   : ${sale.shop.name}`);
    if (sale.serviceOrderStatus) lines.push(`Job Status: ${sale.serviceOrderStatus}`);
    lines.push('--------------------------------');
    lines.push('Item              Qty    Total  ');
    lines.push('--------------------------------');

    for (const item of sale.items || []) {
      const itemName = item.product?.name || item.service?.name || 'Item';
      const name = itemName.padEnd(16, ' ').slice(0, 16);
      const qty = item.quantity.toString().padStart(4, ' ');
      const total = Number(item.totalPrice).toFixed(2).padStart(8, ' ');
      lines.push(`${name} ${qty} ${total}`);
    }

    lines.push('--------------------------------');
    lines.push(`TOTAL AMOUNT  : KSh ${Number(sale.totalAmount).toLocaleString()}`);
    lines.push(`PAID AMOUNT   : KSh ${Number(sale.paidAmount).toLocaleString()}`);
    lines.push('--------------------------------');
    lines.push('Thank you for your business!');
    lines.push('================================\n');

    return lines.join('\n');
  }
}
