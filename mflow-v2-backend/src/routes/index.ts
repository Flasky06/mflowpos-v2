import { Router } from 'express';
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

const router = Router();

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
