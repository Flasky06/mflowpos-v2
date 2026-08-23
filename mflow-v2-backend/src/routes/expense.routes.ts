import { Router } from 'express';
import {
  ExpenseController,
  createExpenseCategorySchema,
  createExpenseSchema,
} from '../controllers/expense.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { checkSubscriptionPaywall } from '../middlewares/paywall.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Expense Categories
router.get('/categories', ExpenseController.getCategories);
router.post(
  '/categories',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createExpenseCategorySchema),
  ExpenseController.createCategory
);
router.put(
  '/categories/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createExpenseCategorySchema),
  ExpenseController.updateCategory
);
router.delete(
  '/categories/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  ExpenseController.deleteCategory
);

// Expenses
router.get('/', ExpenseController.getExpenses);
router.post(
  '/',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN),
  validateBody(createExpenseSchema),
  ExpenseController.createExpense
);
router.delete(
  '/:id',
  checkSubscriptionPaywall,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  ExpenseController.deleteExpense
);

export default router;
