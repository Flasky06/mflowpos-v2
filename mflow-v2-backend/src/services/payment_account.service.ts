import { prisma } from '../config/db';

export class PaymentAccountService {
  static async getPaymentAccounts(businessId: string, shopId?: string) {
    let accounts = await prisma.paymentAccount.findMany({
      where: {
        businessId,
        active: true,
        OR: [
          { shopId: null },
          shopId ? { shopId } : {},
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // If business has no payment accounts yet, seed standard defaults automatically
    if (accounts.length === 0) {
      const defaults = [
        { name: 'Cash Account', type: 'CASH', accountNumber: null, isDefault: true },
        { name: 'M-Pesa Express', type: 'MPESA', accountNumber: 'Default Paybill / Till', isDefault: false },
        { name: 'Card / POS Terminal', type: 'CARD', accountNumber: null, isDefault: false },
        { name: 'Customer Credit', type: 'CREDIT', accountNumber: null, isDefault: false },
      ];

      for (const item of defaults) {
        await prisma.paymentAccount.create({
          data: {
            name: item.name,
            type: item.type,
            accountNumber: item.accountNumber,
            isDefault: item.isDefault,
            businessId,
          },
        });
      }

      accounts = await prisma.paymentAccount.findMany({
        where: { businessId, active: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    return accounts;
  }

  static async createPaymentAccount(
    businessId: string,
    data: {
      name: string;
      type: string;
      accountNumber?: string;
      description?: string;
      shopId?: string;
      isDefault?: boolean;
    },
    userId?: string
  ) {
    if (data.isDefault) {
      await prisma.paymentAccount.updateMany({
        where: { businessId },
        data: { isDefault: false },
      });
    }

    return prisma.paymentAccount.create({
      data: {
        name: data.name,
        type: data.type || 'MPESA',
        accountNumber: data.accountNumber || null,
        description: data.description || null,
        isDefault: data.isDefault || false,
        businessId,
        shopId: data.shopId || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async updatePaymentAccount(
    id: string,
    businessId: string,
    data: {
      name?: string;
      type?: string;
      accountNumber?: string;
      description?: string;
      shopId?: string;
      isDefault?: boolean;
      active?: boolean;
    },
    userId?: string
  ) {
    const existing = await prisma.paymentAccount.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      throw new Error('Payment account not found');
    }

    if (data.isDefault) {
      await prisma.paymentAccount.updateMany({
        where: { businessId },
        data: { isDefault: false },
      });
    }

    return prisma.paymentAccount.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  static async deletePaymentAccount(id: string, businessId: string) {
    const existing = await prisma.paymentAccount.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      throw new Error('Payment account not found');
    }

    return prisma.paymentAccount.update({
      where: { id },
      data: { active: false },
    });
  }
}
