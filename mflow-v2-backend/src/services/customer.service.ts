import { prisma } from '../config/db';

export class CustomerService {
  static async getCustomers(businessId: string, search?: string) {
    const where: any = { businessId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { sales: true, quotations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCustomerById(customerId: string, businessId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
      include: {
        sales: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true } }, payments: true },
        },
        quotations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  static async createCustomer(
    businessId: string,
    data: { name: string; email?: string; phone?: string }
  ) {
    return prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        businessId,
      },
    });
  }

  static async updateCustomer(
    customerId: string,
    businessId: string,
    data: { name?: string; email?: string; phone?: string }
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return prisma.customer.update({
      where: { id: customerId },
      data,
    });
  }

  static async payDebt(
    customerId: string,
    businessId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) {
    if (amount <= 0) {
      throw new Error('Debt payment amount must be positive');
    }

    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: customerId, businessId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const currentBalance = Number(customer.outstandingBalance);
      if (currentBalance <= 0) {
        throw new Error('Customer has no outstanding debt balance');
      }

      const newBalance = Math.max(0, currentBalance - amount);

      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          outstandingBalance: newBalance,
        },
      });

      return {
        customer: updatedCustomer,
        paidAmount: amount,
        previousBalance: currentBalance,
        remainingBalance: newBalance,
        paymentMethod,
        notes,
      };
    });
  }

  static async deleteCustomer(customerId: string, businessId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    if (Number(customer.outstandingBalance) > 0) {
      throw new Error('Cannot delete customer with active outstanding debt balance');
    }

    return prisma.customer.delete({
      where: { id: customerId },
    });
  }
}
