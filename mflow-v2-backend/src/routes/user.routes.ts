import { Router } from 'express';
import {
  UserController,
  createUserSchema,
  updatePermissionsSchema,
} from '../controllers/user.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Only SUPER_ADMIN, ADMIN, or SHOP_ADMIN can view and manage staff users
router.get('/', authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN), UserController.getUsers);

router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createUserSchema),
  UserController.createUser
);

router.put(
  '/:id/permissions',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  validateBody(updatePermissionsSchema),
  UserController.updatePermissions
);

router.put(
  '/:id/status',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  UserController.toggleStatus
);

router.delete(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  UserController.deleteUser
);

export default router;
