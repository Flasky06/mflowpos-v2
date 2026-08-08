import { Router } from 'express';
import {
  SubscriptionController,
  upgradeSubscriptionSchema,
} from '../controllers/subscription.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Public Plans List
router.get('/plans', SubscriptionController.getPlans);

// Authenticated Subscription Endpoints
router.use(authenticateJWT);
router.get('/current', SubscriptionController.getCurrentSubscription);
router.post(
  '/upgrade',
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  validateBody(upgradeSubscriptionSchema),
  SubscriptionController.upgrade
);

export default router;
