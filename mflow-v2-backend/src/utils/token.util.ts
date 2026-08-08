import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  customPermissions?: string[];
  businessId?: string | null;
  shopId?: string | null;
}

export class TokenUtil {
  static generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: ENV.JWT_ACCESS_EXPIRATION as any,
    };
    return jwt.sign(payload, ENV.JWT_ACCESS_SECRET as Secret, options);
  }

  static generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: ENV.JWT_REFRESH_EXPIRATION as any,
    };
    return jwt.sign(payload, ENV.JWT_REFRESH_SECRET as Secret, options);
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, ENV.JWT_ACCESS_SECRET as Secret) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET as Secret) as TokenPayload;
  }
}
