import { prisma } from '../config/db';
import { QuotationStatus } from '@prisma/client';
import { SaleService, CreateSalePaymentDTO } from './sale.service';

export class QuotationService {
  static async createQuotation(
    businessId: string,
    shopId: string,
    userId: string,
    dto: {
      items: { productId: string; quantity: number; unitPrice: number }[];
      customerId?: string;
      expiryDate?: string;
      notes?: string;
    }
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Quotation must contain at least one item');
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

      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;

      preparedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
      });
    }

    const quotationNumber = `QT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    return prisma.quotation.create({
      data: {
        quotationNumber,
        totalAmount,
        status: QuotationStatus.DRAFT,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        notes: dto.notes,
        businessId,
        shopId,
        userId,
        customerId: dto.customerId,
        items: {
          create: preparedItems,
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
        shop: true,
        user: { select: { fullName: true } },
      },
    });
  }

  static async getQuotations(businessId: string, shopId?: string) {
    const where: any = { businessId };
    if (shopId) where.shopId = shopId;

    return prisma.quotation.findMany({
      where,
      include: {
        items: { include: { product: true } },
        customer: true,
        user: { select: { fullName: true } },
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getQuotationById(quotationId: string, businessId: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, businessId },
      include: {
        items: { include: { product: true } },
        customer: true,
        user: { select: { fullName: true } },
        shop: true,
      },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    return quotation;
  }

  static async convertToSale(
    quotationId: string,
    businessId: string,
    userId: string,
    payments: CreateSalePaymentDTO[]
  ) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, businessId },
      include: { items: true },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (quotation.status === QuotationStatus.CONVERTED) {
      throw new Error('Quotation has already been converted to a sale');
    }

    // Convert quotation items into SaleDTO and execute SaleService
    const saleItems = quotation.items.map((i) => ({
      productId: i.productId || undefined,
      serviceId: i.serviceId || undefined,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    }));

    const result = await SaleService.createSale(businessId, quotation.shopId, userId, {
      items: saleItems,
      payments,
      customerId: quotation.customerId || undefined,
    });

    // Mark quotation status as CONVERTED
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.CONVERTED },
    });

    return result;
  }
}
