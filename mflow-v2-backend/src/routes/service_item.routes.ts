import { Router } from 'express';
import {
  ServiceItemController,
  createServiceSchema,
} from '../controllers/service_item.controller';
import { authenticateJWT, authorizeRoles, checkPermission } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

router.get('/', ServiceItemController.getServices);
router.get('/:id', ServiceItemController.getServiceById);

router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  checkPermission('CAN_CREATE_PRODUCT'),
  validateBody(createServiceSchema),
  ServiceItemController.createService
);

router.put(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  checkPermission('CAN_CREATE_PRODUCT'),
  ServiceItemController.updateService
);

router.delete(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  ServiceItemController.deleteService
);

export default router;
