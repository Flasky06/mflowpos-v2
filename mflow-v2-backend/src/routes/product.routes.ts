import { Router } from 'express';
import {
  ProductController,
  createProductSchema,
  adjustStockSchema,
} from '../controllers/product.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router();

router.use(authenticateJWT);

// Categories
router.get('/categories', ProductController.getCategories);
router.post(
  '/categories',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(z.object({ name: z.string().min(1) })),
  ProductController.createCategory
);
router.put(
  '/categories/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(z.object({ name: z.string().min(1) })),
  ProductController.updateCategory
);
router.delete(
  '/categories/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  ProductController.deleteCategory
);

// Products
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);
router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createProductSchema),
  ProductController.createProduct
);
router.put(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createProductSchema.partial()),
  ProductController.updateProduct
);
router.post(
  '/:id/adjust-stock',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(adjustStockSchema),
  ProductController.adjustStock
);
router.delete(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  ProductController.deleteProduct
);

export default router;
