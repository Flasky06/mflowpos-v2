import { prisma } from '../config/db';
import { SaleStatus } from '@prisma/client';

export class ReportService {
  static async getDashboardSummary(
    businessId: string,
    shopId?: string,
    startDate?: string,
    endDate?: string,
    itemType?: 'PRODUCTS_ONLY' | 'SERVICES_ONLY' | 'BOTH'
  ) {
    const salesWhere: any = {
      businessId,
      status: SaleStatus.COMPLETED,
    };

    const expenseWhere: any = { businessId };

    if (shopId) {
      salesWhere.shopId = shopId;
      expenseWhere.shopId = shopId;
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }

      salesWhere.createdAt = dateFilter;
      expenseWhere.createdAt = dateFilter;
    }

    // 1. Calculate Sales & Revenue
    const sales = await prisma.sale.findMany({
      where: salesWhere,
      include: {
        items: true,
      },
    });

    let totalSalesRevenue = 0;
    let totalPaidRevenue = 0;
    let filteredSalesCount = 0;

    for (const sale of sales) {
      const hasProducts = sale.items.some((i) => i.productId !== null);
      const hasServices = sale.items.some((i) => i.serviceId !== null);

      if (itemType === 'PRODUCTS_ONLY' && !hasProducts) continue;
      if (itemType === 'SERVICES_ONLY' && !hasServices) continue;

      totalSalesRevenue += Number(sale.totalAmount);
      totalPaidRevenue += Number(sale.paidAmount);
      filteredSalesCount++;
    }

    // 2. Calculate Expenses
    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      select: { amount: true },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalPaidRevenue - totalExpenses;

    // 3. Stock & Count Metrics
    const lowStockCount = await prisma.productStock.count({
      where: {
        shop: { businessId, deletedAt: null },
        shopId: shopId || undefined,
        quantity: { lte: 5 },
      },
    });

    const totalCustomersCount = await prisma.customer.count({
      where: { businessId },
    });

    const totalProductsCount = await prisma.product.count({
      where: { businessId, deletedAt: null },
    });

    const totalServicesCount = await prisma.service.count({
      where: { businessId, deletedAt: null },
    });

    return {
      itemTypeFilter: itemType || 'BOTH',
      totalSalesRevenue,
      totalPaidRevenue,
      totalExpenses,
      netProfit,
      totalSalesCount: filteredSalesCount,
      lowStockProductsCount: lowStockCount,
      totalCustomersCount,
      totalProductsCount,
      totalServicesCount,
    };
  }

  static async getTopSellingItems(
    businessId: string,
    shopId?: string,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
    itemType: 'PRODUCTS_ONLY' | 'SERVICES_ONLY' | 'BOTH' = 'BOTH'
  ) {
    const salesWhere: any = {
      businessId,
      status: SaleStatus.COMPLETED,
    };

    if (shopId) salesWhere.shopId = shopId;
    if (startDate || endDate) {
      salesWhere.createdAt = {};
      if (startDate) salesWhere.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        salesWhere.createdAt.lte = end;
      }
    }

    const itemWhere: any = {};
    if (itemType === 'PRODUCTS_ONLY') itemWhere.productId = { not: null };
    if (itemType === 'SERVICES_ONLY') itemWhere.serviceId = { not: null };

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: salesWhere,
        ...itemWhere,
      },
      include: {
        product: { select: { id: true, name: true, sku: true, sellingPrice: true } },
        service: { select: { id: true, name: true, code: true, price: true } },
      },
    });

    // Map items
    const itemMap = new Map<
      string,
      { id: string; name: string; codeOrSku: string | null; type: 'PRODUCT' | 'SERVICE'; totalQty: number; totalRevenue: number }
    >();

    for (const item of saleItems) {
      const isProd = !!item.productId;
      const key = isProd ? `PROD_${item.productId}` : `SRV_${item.serviceId}`;
      const name = isProd ? item.product?.name : item.service?.name;
      const codeOrSku = isProd ? item.product?.sku : item.service?.code;
      const type = isProd ? 'PRODUCT' : 'SERVICE';

      if (!name) continue;

      const existing = itemMap.get(key);
      const qty = item.quantity;
      const rev = Number(item.totalPrice);

      if (existing) {
        existing.totalQty += qty;
        existing.totalRevenue += rev;
      } else {
        itemMap.set(key, {
          id: (isProd ? item.productId : item.serviceId)!,
          name,
          codeOrSku: codeOrSku || null,
          type,
          totalQty: qty,
          totalRevenue: rev,
        });
      }
    }

    return Array.from(itemMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  static async getInventoryValuation(businessId: string, shopId?: string) {
    const stocks = await prisma.productStock.findMany({
      where: {
        shop: { businessId, deletedAt: null },
        shopId: shopId || undefined,
        product: { deletedAt: null },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
            sellingPrice: true,
          },
        },
        shop: { select: { name: true } },
      },
    });

    let totalQuantity = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    const lowStockItems = [];

    for (const s of stocks) {
      totalQuantity += s.quantity;
      const cost = Number(s.product.costPrice || 0);
      const retail = Number(s.product.sellingPrice);

      totalCostValuation += s.quantity * cost;
      totalRetailValuation += s.quantity * retail;

      if (s.quantity <= s.minStockLevel) {
        lowStockItems.push({
          productId: s.product.id,
          name: s.product.name,
          sku: s.product.sku,
          shopName: s.shop.name,
          quantity: s.quantity,
          minStockLevel: s.minStockLevel,
        });
      }
    }

    return {
      totalProductsCount: stocks.length,
      totalQuantity,
      totalCostValuation,
      totalRetailValuation,
      potentialProfitMargin: totalRetailValuation - totalCostValuation,
      lowStockItemsCount: lowStockItems.length,
      lowStockItems,
    };
  }
}
