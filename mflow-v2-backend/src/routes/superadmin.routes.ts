import { Router } from 'express';
import {
  SuperAdminController,
  updateUserRoleSchema,
  resetUserPasswordSchema,
  activateCashPaymentSchema,
  overrideSubscriptionSchema,
  updateBusinessSchema,
} from '../controllers/superadmin.controller';
import { authenticateSuperAdminJWT } from '../middlewares/superadmin_auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';

const router = Router();

// Completely isolated SuperAdmin Authentication Guard
router.use(authenticateSuperAdminJWT as any);

// Platform Overview & KPI Stats
router.get('/stats', SuperAdminController.getPlatformStats);

// User & Permissions Management
router.get('/users', SuperAdminController.getAllUsers);
router.put('/users/:userId/role', validateBody(updateUserRoleSchema), SuperAdminController.updateUserRole);
router.put('/users/:userId/suspend', SuperAdminController.suspendUser);
router.put('/users/:userId/reactivate', SuperAdminController.reactivateUser);
router.post('/users/:userId/reset-password', validateBody(resetUserPasswordSchema), SuperAdminController.resetUserPassword);
router.delete('/users/:userId', SuperAdminController.deleteUser);

// Businesses & Subscriptions Management
router.get('/businesses', SuperAdminController.getAllBusinesses);
router.get('/tenants', SuperAdminController.getAllBusinesses);

router.put('/businesses/:businessId', validateBody(updateBusinessSchema), SuperAdminController.updateBusiness);
router.put('/tenants/:businessId', validateBody(updateBusinessSchema), SuperAdminController.updateBusiness);

router.put('/businesses/:businessId/status', SuperAdminController.toggleBusinessStatus);
router.put('/tenants/:businessId/suspend', SuperAdminController.toggleBusinessStatus);
router.put('/tenants/:businessId/reactivate', SuperAdminController.toggleBusinessStatus);

router.post('/businesses/:businessId/extend-trial', SuperAdminController.extendBusinessTrial);
router.post('/tenants/:businessId/extend-trial', SuperAdminController.extendBusinessTrial);

router.post('/businesses/:businessId/activate-cash', validateBody(activateCashPaymentSchema), SuperAdminController.activateCashPayment);
router.post('/tenants/:businessId/activate-cash-payment', validateBody(activateCashPaymentSchema), SuperAdminController.activateCashPayment);

router.post('/businesses/:businessId/override-subscription', validateBody(overrideSubscriptionSchema), SuperAdminController.overrideSubscription);

router.put('/businesses/:businessId/custom-pricing', SuperAdminController.updateTenantCustomPricing);
router.put('/tenants/:businessId/custom-pricing', SuperAdminController.updateTenantCustomPricing);

// Payments & Audit Trail
router.get('/payments', SuperAdminController.getAllPayments);
router.get('/revenue', SuperAdminController.getAllPayments);

export default router;
