import { Router } from 'express';
import {
  StockTransferController,
  createTransferSchema,
} from '../controllers/stock_transfer.controller';
import { authenticateJWT, authorizeRoles, checkPermission } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

router.get('/', StockTransferController.getTransfers);

router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  checkPermission('CAN_ADJUST_STOCK'),
  validateBody(createTransferSchema),
  StockTransferController.createTransfer
);

export default router;
