import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Zod Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters long'),
  phoneNumber: z.string().optional(),
  phone: z.string().optional(),
  currency: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

export const resendCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  code: z.string().length(6, 'Reset code must be exactly 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const result = await AuthService.register(req.body);
      return ApiResponse.success(res, result, 'User and business registered successfully. Verification email sent.', 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body.email, req.body.password);

      // Set Refresh Token in Cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return ApiResponse.success(res, result, 'Login successful');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 401);
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken ||
        (req.headers['x-refresh-token'] as string);

      if (!refreshToken) {
        return ApiResponse.error(res, 'Refresh token required', 400);
      }

      const result = await AuthService.refreshAccessToken(refreshToken);
      return ApiResponse.success(res, result, 'Token refreshed successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 401);
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    try {
      const result = await AuthService.verifyEmail(req.body.code);
      return ApiResponse.success(res, result, 'Email verified successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async resendCode(req: Request, res: Response) {
    try {
      const result = await AuthService.resendVerificationCode(req.body.email);
      return ApiResponse.success(res, result, 'Verification code resent successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      return ApiResponse.success(res, result, 'Password reset code sent');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const result = await AuthService.resetPassword(req.body.code, req.body.newPassword);
      return ApiResponse.success(res, result, 'Password reset successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.error(res, 'Unauthenticated', 401);
      }
      const user = await AuthService.getCurrentUser(req.user.userId);
      return ApiResponse.success(res, user, 'Authenticated user profile retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 404);
    }
  }
}
