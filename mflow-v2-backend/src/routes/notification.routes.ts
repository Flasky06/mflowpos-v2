import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_ADMIN));

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.put('/read-all', NotificationController.markAllAsRead);
router.put('/:id/read', NotificationController.markAsRead);
router.delete('/:id', NotificationController.deleteNotification);

export default router;
