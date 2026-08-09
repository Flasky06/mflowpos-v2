import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import businessRoutes from './business.routes';
import productRoutes from './product.routes';
import serviceRoutes from './service_item.routes';
import saleRoutes from './sale.routes';
import quotationRoutes from './quotation.routes';
import expenseRoutes from './expense.routes';
import customerRoutes from './customer.routes';
import purchaseRoutes from './purchase.routes';
import transferRoutes from './stock_transfer.routes';
import stockReturnRoutes from './stock_return.routes';
import reportRoutes from './report.routes';
import subscriptionRoutes from './subscription.routes';
import superAdminAuthRoutes from './superadmin_auth.routes';
import superAdminRoutes from './superadmin.routes';
import { ApiResponse } from '../utils/response.util';

const router = Router();

// Root API v1 Information Endpoint
router.get('/', (req: Request, res: Response) => {
  return ApiResponse.success(
    res,
    {
      version: '2.0.0',
      status: 'ONLINE',
      docs: 'https://api.mflowpos.com/api-docs',
      health: 'https://api.mflowpos.com/health',
    },
    'mFlow POS v2 API Engine Live'
  );
});

// Versioned API v1 Router Modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/business', businessRoutes);
router.use('/products', productRoutes);
router.use('/services', serviceRoutes);
router.use('/sales', saleRoutes);
router.use('/quotations', quotationRoutes);
router.use('/expenses', expenseRoutes);
router.use('/customers', customerRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/suppliers', purchaseRoutes);
router.use('/purchase-orders', purchaseRoutes);
router.use('/transfers', transferRoutes);
router.use('/stock-returns', stockReturnRoutes);
router.use('/reports', reportRoutes);
router.use('/subscriptions', subscriptionRoutes);

// Completely Decoupled SuperAdmin Control Desk Routes
router.use('/superadmin/auth', superAdminAuthRoutes);
router.use('/superadmin', superAdminRoutes);

export default router;
