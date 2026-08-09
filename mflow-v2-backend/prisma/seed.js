const { PrismaClient, Role, BillingPeriod, SubscriptionStatus, ShopType } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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
      price: 1000.0,
      billingPeriod: BillingPeriod.MONTHLY,
      maxShops: 1,
    },
    {
      name: 'Growth Plan',
      code: 'GROWTH',
      price: 2000.0,
      billingPeriod: BillingPeriod.MONTHLY,
      maxShops: 3,
    },
    {
      name: 'Enterprise Plan',
      code: 'ENTERPRISE',
      price: 3500.0,
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

      // Admin user
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

      // Cashier User
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

      const catBev = await tx.productCategory.create({
        data: { name: 'Beverages', businessId: business.id },
      });
      const catElec = await tx.productCategory.create({
        data: { name: 'Electronics', businessId: business.id },
      });

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
        },
        {
          name: 'USB-C Fast Charging Cable',
          costPrice: 350.0,
          sellingPrice: 600.0,
          sku: 'ELEC-002',
          barcode: '6001234562',
          unit: 'pcs',
          categoryId: catElec.id,
          mainQty: 25,
        },
      ];

      for (const prodData of sampleProducts) {
        const product = await tx.product.create({
          data: {
            name: prodData.name,
            costPrice: prodData.costPrice,
            sellingPrice: prodData.sellingPrice,
            sku: prodData.sku,
            barcode: prodData.barcode,
            unit: prodData.unit,
            categoryId: prodData.categoryId,
            businessId: business.id,
          },
        });

        await tx.stockLevel.create({
          data: {
            productId: product.id,
            shopId: mainShop.id,
            quantity: prodData.mainQty,
            reorderLevel: 10,
          },
        });
      }
    });

    console.log('Demo business, shops, users & products seeded successfully.');
  } else {
    console.log('Demo accounts already exist in database.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
