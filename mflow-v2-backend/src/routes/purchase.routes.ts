import { Router } from 'express';
import {
  PurchaseController,
  createSupplierSchema,
  createPurchaseOrderSchema,
} from '../controllers/purchase.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Direct & Alias Routes for Suppliers
router.get('/suppliers', PurchaseController.getSuppliers);
router.get('/', PurchaseController.getSuppliers);

router.post(
  '/suppliers',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createSupplierSchema),
  PurchaseController.createSupplier
);
router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createSupplierSchema),
  PurchaseController.createSupplier
);

router.put(
  '/suppliers/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createSupplierSchema.partial()),
  PurchaseController.updateSupplier
);
router.put(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createSupplierSchema.partial()),
  PurchaseController.updateSupplier
);

router.delete(
  '/suppliers/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  PurchaseController.deleteSupplier
);
router.delete(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  PurchaseController.deleteSupplier
);

// Direct & Alias Routes for Purchase Orders
router.get('/orders', PurchaseController.getPurchaseOrders);
router.get('/purchase-orders', PurchaseController.getPurchaseOrders);
router.get('/orders/:id', PurchaseController.getPurchaseOrderById);

router.post(
  '/orders',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createPurchaseOrderSchema),
  PurchaseController.createPurchaseOrder
);
router.post(
  '/purchase-orders',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createPurchaseOrderSchema),
  PurchaseController.createPurchaseOrder
);

router.post(
  '/orders/:id/receive',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  PurchaseController.receivePurchaseOrder
);

export default router;
