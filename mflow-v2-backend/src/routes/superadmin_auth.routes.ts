import { Router } from 'express';
import { SuperAdminAuthController, superAdminLoginSchema } from '../controllers/superadmin_auth.controller';
import { validateBody } from '../middlewares/validate.middleware';

const router = Router();

router.post('/login', validateBody(superAdminLoginSchema), SuperAdminAuthController.login);

export default router;
