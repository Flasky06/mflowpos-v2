import { PrismaClient, Role, BillingPeriod, SubscriptionStatus, ShopType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Seed Subscription Plans with KSh Pricing
  const plans = [
    {
      name: 'Free Trial',
      code: 'FREE_TRIAL',
      price: 0,
      billingPeriod: BillingPeriod.MONTHLY,
      maxShops: 1,
    },
    {
      name: 'Starter Plan',
      code: 'STARTER',
      price: 1000.00, // KSh 1,000 / month
      billingPeriod: BillingPeriod.MONTHLY,
      maxShops: 1,
    },
    {
      name: 'Growth Plan',
      code: 'GROWTH',
      price: 2000.00, // KSh 2,000 / month
      billingPeriod: BillingPeriod.MONTHLY,
      maxShops: 3,
    },
    {
      name: 'Enterprise Plan',
      code: 'ENTERPRISE',
      price: 3500.00, // KSh 3,500 / month
      billingPeriod: BillingPeriod.MONTHLY,
      maxShops: 5,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }
  console.log('Subscription plans seeded successfully with KSh pricing.');

  // 2. Seed Default Super Admin
  const adminEmail = 'superadmin@mflowpos.com';
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Platform Super Admin',
        role: Role.SUPER_ADMIN,
        verified: true,
        active: true,
      },
    });
    console.log('Default Super Admin created (superadmin@mflowpos.com / Admin@123456).');
  }

  // 3. Seed Sample Demo Business Tenant
  const demoEmail = 'admin@apexretail.com';
  const existingDemo = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!existingDemo) {
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    const growthPlan = await prisma.subscriptionPlan.findUnique({ where: { code: 'GROWTH' } });

    // Create Business, User, Shops, Categories, Products, Services, Customers in Transaction
    await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: 'Apex Retailers Ltd',
          email: demoEmail,
          phone: '+254 712 345 678',
          currency: 'KES',
          active: true,
        },
      });

      // Create Active Growth Subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      if (growthPlan) {
        await tx.businessSubscription.create({
          data: {
            businessId: business.id,
            planId: growthPlan.id,
            status: SubscriptionStatus.ACTIVE,
            startDate: new Date(),
            endDate,
          },
        });
      }

      // Create Main Branch (BOTH mode) and Second Branch (PRODUCTS_ONLY mode)
      const mainShop = await tx.shop.create({
        data: {
          name: 'Downtown Main Branch',
          location: 'Kenyatta Avenue, Nairobi',
          phone: '+254 712 345 678',
          shopType: ShopType.BOTH,
          businessId: business.id,
        },
      });

      const secondShop = await tx.shop.create({
        data: {
          name: 'Westlands Retail Outlet',
          location: 'Westlands Road, Nairobi',
          phone: '+254 712 345 679',
          shopType: ShopType.PRODUCTS_ONLY,
          businessId: business.id,
        },
      });

      // Create Business Owner Admin Account
      await tx.user.create({
        data: {
          email: demoEmail,
          password: hashedPassword,
          fullName: 'Alexander Wright',
          role: Role.ADMIN,
          businessId: business.id,
          shopId: mainShop.id,
          verified: true,
          active: true,
        },
      });

      // Create Cashier Sales Rep
      await tx.user.create({
        data: {
          email: 'cashier@apexretail.com',
          password: hashedPassword,
          fullName: 'Sarah Jenkins',
          role: Role.SALES_REP,
          customPermissions: ['CAN_CANCEL_SALE', 'CAN_ADJUST_STOCK'],
          businessId: business.id,
          shopId: mainShop.id,
          verified: true,
          active: true,
        },
      });

      // Create Product Categories
      const catBev = await tx.productCategory.create({
        data: { name: 'Beverages', businessId: business.id },
      });
      const catElec = await tx.productCategory.create({
        data: { name: 'Electronics', businessId: business.id },
      });
      const catGroc = await tx.productCategory.create({
        data: { name: 'Groceries', businessId: business.id },
      });

      // Create Products & Stock for both shops
      const sampleProducts = [
        {
          name: 'Coca-Cola 500ml',
          costPrice: 60.0,
          sellingPrice: 80.0,
          sku: 'BEV-001',
          barcode: '6001234561',
          unit: 'pcs',
          categoryId: catBev.id,
          mainQty: 60,
          secondQty: 40,
        },
        {
          name: 'Wireless Earbuds',
          costPrice: 1800.0,
          sellingPrice: 2500.0,
          sku: 'ELEC-001',
          barcode: '6001234562',
          unit: 'pcs',
          categoryId: catElec.id,
          mainQty: 15,
          secondQty: 10,
        },
        {
          name: 'Whole Milk 1L',
          costPrice: 110.0,
          sellingPrice: 130.0,
          sku: 'GROC-001',
          barcode: '6001234563',
          unit: 'pcs',
          categoryId: catGroc.id,
          mainQty: 45,
          secondQty: 20,
        },
        {
          name: 'Energy Drink 250ml',
          costPrice: 120.0,
          sellingPrice: 160.0,
          sku: 'BEV-002',
          barcode: '6001234564',
          unit: 'pcs',
          categoryId: catBev.id,
          mainQty: 3, // Low stock item
          secondQty: 2,
        },
      ];

      for (const prodData of sampleProducts) {
        const { mainQty, secondQty, ...prodDataRest } = prodData;
        const product = await tx.product.create({
          data: {
            ...prodDataRest,
            businessId: business.id,
          },
        });

        // Stock in Main Shop
        await tx.productStock.create({
          data: {
            productId: product.id,
            shopId: mainShop.id,
            quantity: mainQty,
            minStockLevel: 5,
          },
        });

        // Stock in Second Shop
        await tx.productStock.create({
          data: {
            productId: product.id,
            shopId: secondShop.id,
            quantity: secondQty,
            minStockLevel: 5,
          },
        });
      }

      // Create Service Categories & Services
      const catLaund = await tx.serviceCategory.create({
        data: { name: 'Laundry & Dry Cleaning', businessId: business.id },
      });
      const catRep = await tx.serviceCategory.create({
        data: { name: 'Device Repair Jobs', businessId: business.id },
      });

      await tx.service.createMany({
        data: [
          {
            name: 'Dry Cleaning 2-Piece Suit',
            price: 800.0,
            code: 'SRV-SUIT',
            categoryId: catLaund.id,
            businessId: business.id,
            shopId: mainShop.id,
          },
          {
            name: 'Shirt Washing & Pressing',
            price: 250.0,
            code: 'SRV-SHIRT',
            categoryId: catLaund.id,
            businessId: business.id,
            shopId: mainShop.id,
          },
          {
            name: 'Screen Replacement Service',
            price: 3500.0,
            code: 'SRV-SCREEN',
            categoryId: catRep.id,
            businessId: business.id,
            shopId: mainShop.id,
          },
        ],
      });

      // Create Sample Customers & Debt
      await tx.customer.createMany({
        data: [
          {
            name: 'Alice Smith',
            email: 'alice@gmail.com',
            phone: '+254 722 000 111',
            outstandingBalance: 0.0,
            businessId: business.id,
          },
          {
            name: 'Bob Johnson',
            email: 'bob@gmail.com',
            phone: '+254 722 000 222',
            outstandingBalance: 1500.0, // Credit balance
            businessId: business.id,
          },
        ],
      });

      // Create Expense Categories
      await tx.expenseCategory.createMany({
        data: [
          { name: 'Rent & Leases', businessId: business.id },
          { name: 'Utilities & Power', businessId: business.id },
          { name: 'Staff Salaries', businessId: business.id },
          { name: 'Transport & Freight', businessId: business.id },
        ],
      });

      // Create Sample Supplier
      await tx.supplier.create({
        data: {
          name: 'Global Beverages & Tech Distributors',
          contactPerson: 'David Miller',
          email: 'orders@globaldist.com',
          phone: '+254 733 999 888',
          businessId: business.id,
        },
      });
    });

    console.log('Sample Demo Business (admin@apexretail.com / Password123!) seeded successfully with KES pricing.');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
