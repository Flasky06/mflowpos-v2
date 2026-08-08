import { Request, Response } from 'express';
import { z } from 'zod';
import { SuperAdminAuthService } from '../services/superadmin_auth.service';
import { ApiResponse } from '../utils/response.util';

export const superAdminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class SuperAdminAuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await SuperAdminAuthService.login(email, password);

      res.cookie('superAdminRefreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return ApiResponse.success(res, result, 'SuperAdmin authentication successful');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 401);
    }
  }
}
