import { Router } from 'express';
import { BusinessController, updateBusinessSchema, createShopSchema } from '../controllers/business.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Business Profile Routes
router.get('/', BusinessController.getProfile);
router.put('/', authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), validateBody(updateBusinessSchema), BusinessController.updateProfile);

// Shop / Branch Routes
router.get('/shops', BusinessController.getShops);
router.post(
  '/shops',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  validateBody(createShopSchema),
  BusinessController.createShop
);
router.put(
  '/shops/:shopId',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  validateBody(createShopSchema.partial()),
  BusinessController.updateShop
);
router.delete(
  '/shops/:shopId',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  BusinessController.deleteShop
);

export default router;
