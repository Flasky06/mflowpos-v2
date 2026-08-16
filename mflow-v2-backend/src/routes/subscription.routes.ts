import { Router } from 'express';
import {
  SubscriptionController,
  upgradeSubscriptionSchema,
} from '../controllers/subscription.controller';
import { PaystackController } from '../controllers/paystack.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Public Plans List & Paystack Webhook
router.get('/plans', SubscriptionController.getPlans);
router.post('/paystack/webhook', PaystackController.handleWebhook);

// Authenticated Subscription & Paystack Checkout Endpoints
router.use(authenticateJWT);

router.post('/paystack/initialize', PaystackController.initializeSubscription);
router.get('/paystack/verify/:reference', PaystackController.verifyPayment);

router.get('/current', SubscriptionController.getCurrentSubscription);
router.post(
  '/upgrade',
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  validateBody(upgradeSubscriptionSchema),
  SubscriptionController.upgrade
);

export default router;
