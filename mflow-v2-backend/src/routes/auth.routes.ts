import { Router } from 'express';
import {
  AuthController,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Public Authentication Routes
router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/verify-email', validateBody(verifyEmailSchema), AuthController.verifyEmail);
router.post('/resend-code', validateBody(resendCodeSchema), AuthController.resendCode);
router.post('/forgot-password', validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), AuthController.resetPassword);

// Protected Auth Route
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
