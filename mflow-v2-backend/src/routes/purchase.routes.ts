import { Router, Request, Response, NextFunction } from 'express';
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

// Specific Named Routes
router.get('/suppliers', PurchaseController.getSuppliers);
router.post(
  '/suppliers',
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
router.delete(
  '/suppliers/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  PurchaseController.deleteSupplier
);

router.get('/orders', PurchaseController.getPurchaseOrders);
router.get('/purchase-orders', PurchaseController.getPurchaseOrders);
router.get('/orders/:id', PurchaseController.getPurchaseOrderById);
router.get('/purchase-orders/:id', PurchaseController.getPurchaseOrderById);

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

router.post('/orders/:id/receive', checkSubscriptionPaywall, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN), PurchaseController.receivePurchaseOrder);
router.put('/orders/:id/receive', checkSubscriptionPaywall, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN), PurchaseController.receivePurchaseOrder);
router.post('/purchase-orders/:id/receive', checkSubscriptionPaywall, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN), PurchaseController.receivePurchaseOrder);
router.put('/purchase-orders/:id/receive', checkSubscriptionPaywall, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN), PurchaseController.receivePurchaseOrder);

// Root `/` Dynamic Handlers based on Mount Point (e.g., /suppliers vs /purchase-orders vs /purchases)
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  if (req.baseUrl.includes('purchase-orders')) {
    return PurchaseController.getPurchaseOrders(req as any, res);
  }
  return PurchaseController.getSuppliers(req as any, res);
});

router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.baseUrl.includes('purchase-orders')) {
      return validateBody(createPurchaseOrderSchema)(req, res, () =>
        PurchaseController.createPurchaseOrder(req as any, res)
      );
    }
    return validateBody(createSupplierSchema)(req, res, () =>
      PurchaseController.createSupplier(req as any, res)
    );
  }
);

router.put(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.baseUrl.includes('purchase-orders')) {
      return PurchaseController.getPurchaseOrderById(req as any, res);
    }
    return validateBody(createSupplierSchema.partial())(req, res, () =>
      PurchaseController.updateSupplier(req as any, res)
    );
  }
);

router.delete(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  (req: Request, res: Response, next: NextFunction) => {
    return PurchaseController.deleteSupplier(req as any, res);
  }
);

router.put('/:id/receive', checkSubscriptionPaywall, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN), PurchaseController.receivePurchaseOrder);
router.post('/:id/receive', checkSubscriptionPaywall, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN), PurchaseController.receivePurchaseOrder);

export default router;
