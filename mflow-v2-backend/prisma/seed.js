const { PrismaClient, Role, BillingPeriod, SubscriptionStatus, ShopType } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Seed Single Standard Plan — KES 1,000/month, unlimited shops
  const standardPlan = {
    name: 'mflow POS',
    code: 'STANDARD',
    price: 1000.0,
    billingPeriod: BillingPeriod.MONTHLY,
    maxShops: 999, // effectively unlimited
  };

  await prisma.subscriptionPlan.upsert({
    where: { code: standardPlan.code },
    update: standardPlan,
    create: standardPlan,
  });
  console.log('Standard plan seeded: mflow POS — KES 1,000/month (unlimited shops).');

  // 2. Seed Default Super Admin (admin@mflowpos.com / @071729106)
  const adminEmail = 'admin@mflowpos.com';
  const superAdminPasswordHash = await bcrypt.hash('@071729106', 10);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: superAdminPasswordHash,
      role: Role.SUPER_ADMIN,
      verified: true,
      active: true,
    },
    create: {
      email: adminEmail,
      password: superAdminPasswordHash,
      fullName: 'Platform Super Admin',
      role: Role.SUPER_ADMIN,
      verified: true,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'superadmin@mflowpos.com' },
    update: {
      password: superAdminPasswordHash,
      role: Role.SUPER_ADMIN,
      verified: true,
      active: true,
    },
    create: {
      email: 'superadmin@mflowpos.com',
      password: superAdminPasswordHash,
      fullName: 'Platform Super Admin',
      role: Role.SUPER_ADMIN,
      verified: true,
      active: true,
    },
  });
  console.log('Super Admin users upserted (admin@mflowpos.com & superadmin@mflowpos.com / @071729106).');

  // 3. Seed Sample Demo Business Tenant
  const demoEmail = 'admin@apexretail.com';
  const cashierEmail = 'cashier@apexretail.com';
  const demoPasswordHash = await bcrypt.hash('Password123!', 10);
  const stdPlan = await prisma.subscriptionPlan.findUnique({ where: { code: 'STANDARD' } });

  const existingDemo = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!existingDemo) {
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

      if (stdPlan) {
        await tx.businessSubscription.create({
          data: {
            businessId: business.id,
            planId: stdPlan.id,
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

      await tx.shop.create({
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
          password: demoPasswordHash,
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
          email: cashierEmail,
          password: demoPasswordHash,
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

        await tx.productStock.create({
          data: {
            productId: product.id,
            shopId: mainShop.id,
            quantity: prodData.mainQty,
            minStockLevel: 5,
          },
        });
      }
    });
    console.log('Demo business, shops, users & products seeded successfully.');
  } else {
    // Update passwords for existing demo accounts to ensure known values
    await prisma.user.update({
      where: { email: demoEmail },
      data: { password: demoPasswordHash, active: true },
    });
    await prisma.user.updateMany({
      where: { email: cashierEmail },
      data: { password: demoPasswordHash, active: true },
    });
    console.log('Demo account passwords updated to Password123!');
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
