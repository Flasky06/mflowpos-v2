import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Reports available to SUPER_ADMIN, ADMIN, SHOP_ADMIN, and SALES_REP
router.get('/dashboard', authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN, Role.SALES_REP), ReportController.getDashboardSummary);
router.get('/top-products', authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN, Role.SALES_REP), ReportController.getTopSellingProducts);
router.get('/inventory-valuation', authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN), ReportController.getInventoryValuation);

export default router;
