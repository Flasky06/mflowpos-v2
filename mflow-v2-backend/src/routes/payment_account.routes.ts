import { Router } from 'express';
import {
  PaymentAccountController,
  createPaymentAccountSchema,
} from '../controllers/payment_account.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

router.get('/', PaymentAccountController.getPaymentAccounts);

router.post(
  '/',
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createPaymentAccountSchema),
  PaymentAccountController.createPaymentAccount
);

router.put(
  '/:id',
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  PaymentAccountController.updatePaymentAccount
);

router.delete(
  '/:id',
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  PaymentAccountController.deletePaymentAccount
);

export default router;
