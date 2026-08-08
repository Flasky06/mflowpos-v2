import { Router } from 'express';
import {
  CustomerController,
  createCustomerSchema,
  payDebtSchema,
} from '../controllers/customer.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

router.get('/', CustomerController.getCustomers);
router.get('/:id', CustomerController.getCustomerById);
router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN, Role.SALES_REP),
  validateBody(createCustomerSchema),
  CustomerController.createCustomer
);
router.put(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createCustomerSchema.partial()),
  CustomerController.updateCustomer
);
router.post(
  '/:id/pay-debt',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN, Role.SALES_REP),
  validateBody(payDebtSchema),
  CustomerController.payDebt
);
router.delete(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  CustomerController.deleteCustomer
);

export default router;
