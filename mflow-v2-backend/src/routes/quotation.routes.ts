import { Router } from 'express';
import {
  QuotationController,
  createQuotationSchema,
  convertQuotationSchema,
} from '../controllers/quotation.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

router.get('/', QuotationController.getQuotations);
router.get('/:id', QuotationController.getQuotationById);
router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN, Role.SALES_REP),
  validateBody(createQuotationSchema),
  QuotationController.createQuotation
);
router.post(
  '/:id/convert',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN, Role.SALES_REP),
  validateBody(convertQuotationSchema),
  QuotationController.convertToSale
);

export default router;
