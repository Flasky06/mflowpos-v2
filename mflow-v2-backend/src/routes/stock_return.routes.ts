import { Router } from 'express';
import {
  StockReturnController,
  createStockReturnSchema,
} from '../controllers/stock_return.controller';
import { authenticateJWT, authorizeRoles, checkPermission } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

router.get('/', StockReturnController.getStockReturns);

router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  checkPermission('CAN_ADJUST_STOCK'),
  validateBody(createStockReturnSchema),
  StockReturnController.createStockReturn
);

export default router;
