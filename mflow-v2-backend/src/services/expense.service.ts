import { prisma } from '../config/db';

export class ExpenseService {
  // Category management
  static async getCategories(businessId: string) {
    let categories = await prisma.expenseCategory.findMany({
      where: { businessId },
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      const defaultNames = [
        'Utilities & Bills',
        'Rent & Premises',
        'Salaries & Wages',
        'Transport & Logistics',
        'Supplies & Goods',
        'Marketing & Ads',
        'Repairs & Maintenance',
        'Miscellaneous Expenses',
      ];

      await prisma.expenseCategory.createMany({
        data: defaultNames.map((name) => ({ name, businessId })),
        skipDuplicates: true,
      });

      categories = await prisma.expenseCategory.findMany({
        where: { businessId },
        include: { _count: { select: { expenses: true } } },
        orderBy: { name: 'asc' },
      });
    }

    return categories;
  }

  static async createCategory(businessId: string, name: string) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { businessId, name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      throw new Error('Expense category with this name already exists');
    }

    return prisma.expenseCategory.create({
      data: {
        name,
        businessId,
      },
    });
  }

  static async updateCategory(businessId: string, categoryId: string, name: string) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { businessId, id: categoryId },
    });

    if (!existing) {
      throw new Error('Expense category not found');
    }

    const nameCheck = await prisma.expenseCategory.findFirst({
      where: {
        businessId,
        name: { equals: name, mode: 'insensitive' },
        NOT: { id: categoryId },
      },
    });

    if (nameCheck) {
      throw new Error('Another expense category with this name already exists');
    }

    return prisma.expenseCategory.update({
      where: { id: categoryId },
      data: { name },
    });
  }

  static async deleteCategory(businessId: string, categoryId: string) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { businessId, id: categoryId },
    });

    if (!existing) {
      throw new Error('Expense category not found');
    }

    return prisma.expenseCategory.delete({
      where: { id: categoryId },
    });
  }

  // Expense management
  static async getExpenses(
    businessId: string,
    shopId?: string,
    categoryId?: string,
    startDate?: string,
    endDate?: string
  ) {
    const where: any = { businessId };

    if (shopId) where.shopId = shopId;
    if (categoryId) where.categoryId = categoryId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        shop: { select: { name: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Total expense amount summary
    const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    return {
      totalAmount,
      count: expenses.length,
      expenses,
    };
  }

  static async createExpense(
    businessId: string,
    shopId: string | null | undefined,
    userId: string,
    dto: {
      title: string;
      amount: number;
      categoryId: string;
      paymentMethod?: string;
      notes?: string;
    }
  ) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: dto.categoryId, businessId },
    });

    if (!category) {
      throw new Error('Expense category not found');
    }

    return prisma.expense.create({
      data: {
        title: dto.title,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod || 'CASH',
        notes: dto.notes,
        categoryId: dto.categoryId,
        businessId,
        shopId: shopId || null,
        userId,
      },
      include: {
        category: true,
        shop: { select: { name: true } },
        user: { select: { fullName: true } },
      },
    });
  }

  static async updateExpense(
    expenseId: string,
    businessId: string,
    dto: {
      title?: string;
      amount?: number;
      categoryId?: string;
      paymentMethod?: string;
      notes?: string;
    }
  ) {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, businessId },
    });

    if (!expense) {
      throw new Error('Expense record not found');
    }

    if (dto.categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: { id: dto.categoryId, businessId },
      });
      if (!category) throw new Error('Expense category not found');
    }

    return prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.paymentMethod && { paymentMethod: dto.paymentMethod }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        category: true,
        shop: { select: { name: true } },
        user: { select: { fullName: true } },
      },
    });
  }

  static async deleteExpense(expenseId: string, businessId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, businessId },
    });

    if (!expense) {
      throw new Error('Expense record not found');
    }

    return prisma.expense.delete({
      where: { id: expenseId },
    });
  }
}
