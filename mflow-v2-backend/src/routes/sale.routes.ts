import { Router } from 'express';
import {
  SaleController,
  createSaleSchema,
  updateServiceOrderStatusSchema,
} from '../controllers/sale.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

router.get('/', SaleController.getSales);
router.get('/:id', SaleController.getSaleById);

router.post('/', checkSubscriptionPaywall, validateBody(createSaleSchema), SaleController.createSale);

router.put(
  '/:id/service-status',
  checkSubscriptionPaywall,
  validateBody(updateServiceOrderStatusSchema),
  SaleController.updateServiceOrderStatus
);

router.put(
  '/:id/cancel',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  SaleController.cancelSale
);

export default router;
