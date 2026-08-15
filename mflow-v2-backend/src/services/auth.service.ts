import { prisma } from '../config/db';
import { PasswordUtil } from '../utils/password.util';
import { TokenUtil } from '../utils/token.util';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { Role, SubscriptionStatus } from '@prisma/client';

export class AuthService {
  static async register(dto: {
    email: string;
    password: string;
    fullName: string;
    businessName: string;
    phoneNumber?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await PasswordUtil.hash(dto.password);
    const verificationCode = PasswordUtil.generate6DigitCode();

    const phone = dto.phoneNumber || (dto as any).phone;

    // Execute atomic registration transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Business
      const business = await tx.business.create({
        data: {
          name: dto.businessName,
          email: dto.email.toLowerCase(),
          phone,
        },
      });

      // 2. Create Default Branch (Main Branch)
      const defaultShop = await tx.shop.create({
        data: {
          name: `${dto.businessName} - Main Branch`,
          businessId: business.id,
          phone,
        },
      });

      // 3. Create Owner User (ADMIN role)
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          fullName: dto.fullName,
          phoneNumber: dto.phoneNumber,
          role: Role.ADMIN,
          verificationCode,
          businessId: business.id,
          shopId: defaultShop.id,
        },
      });

      // 4. Attach 14-Day Free Trial Subscription
      let trialPlan = await tx.subscriptionPlan.findUnique({
        where: { code: 'FREE_TRIAL' },
      });

      if (!trialPlan) {
        trialPlan = await tx.subscriptionPlan.create({
          data: {
            name: 'Free Trial',
            code: 'FREE_TRIAL',
            price: 0,
            maxShops: 1,
          },
        });
      }

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      await tx.businessSubscription.create({
        data: {
          businessId: business.id,
          planId: trialPlan.id,
          status: SubscriptionStatus.TRIALING,
          endDate: trialEndDate,
        },
      });

      return { user, business, defaultShop };
    });

    // Send verification email & WhatsApp OTP in background
    EmailService.sendVerificationEmail(dto.email, verificationCode, dto.fullName);
    if (result.user.phoneNumber || dto.phoneNumber) {
      WhatsAppService.sendVerificationCode(result.user.phoneNumber || dto.phoneNumber!, verificationCode, dto.fullName);
    }

    const { password, verificationCode: _, ...userWithoutSecrets } = result.user;
    return {
      user: userWithoutSecrets,
      business: result.business,
      shop: result.defaultShop,
    };
  }

  static async login(identifier: string, passwordStr: string) {
    const cleanId = identifier.trim().toLowerCase();
    const isEmail = cleanId.includes('@');

    const user = isEmail
      ? await prisma.user.findUnique({
          where: { email: cleanId },
          include: {
            business: {
              include: {
                subscription: {
                  include: { plan: true },
                },
              },
            },
            shop: true,
          },
        })
      : await prisma.user.findFirst({
          where: {
            OR: [
              { phoneNumber: cleanId },
              { phoneNumber: '+' + cleanId.replace(/[^0-9]/g, '') },
              { phoneNumber: '0' + cleanId.replace(/[^0-9]/g, '').slice(-9) },
            ],
          },
          include: {
            business: {
              include: {
                subscription: {
                  include: { plan: true },
                },
              },
            },
            shop: true,
          },
        });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await PasswordUtil.compare(passwordStr, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (!user.active) {
      throw new Error('Your user account has been suspended. Please contact your business administrator.');
    }

    if (user.business && !user.business.active) {
      throw new Error('Your business account has been suspended by platform administration.');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      shopId: user.shopId,
    };

    const accessToken = TokenUtil.generateAccessToken(payload);
    const refreshToken = TokenUtil.generateRefreshToken(payload);

    const { password, verificationCode, resetPasswordCode, ...userProfile } = user;

    return {
      user: userProfile,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  static async refreshAccessToken(refreshTokenStr: string) {
    const payload = TokenUtil.verifyRefreshToken(refreshTokenStr);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const newAccessToken = TokenUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      shopId: user.shopId,
    });

    return { accessToken: newAccessToken };
  }

  static async verifyEmail(code: string) {
    const user = await prisma.user.findFirst({
      where: { verificationCode: code },
    });

    if (!user) {
      throw new Error('Invalid or expired verification code');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationCode: null,
      },
      include: {
        business: {
          include: {
            subscription: {
              include: { plan: true },
            },
          },
        },
        shop: true,
      },
    });

    const tokenPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      businessId: updatedUser.businessId,
      shopId: updatedUser.shopId,
    };
    const accessToken = TokenUtil.generateAccessToken(tokenPayload);
    const refreshToken = TokenUtil.generateRefreshToken(tokenPayload);

    const { password, verificationCode: _, ...userWithoutSecrets } = updatedUser;

    return {
      user: userWithoutSecrets,
      tokens: { accessToken, refreshToken },
    };
  }

  static async resendVerificationCode(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.verified) {
      throw new Error('Email is already verified');
    }

    const code = PasswordUtil.generate6DigitCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: code },
    });

    EmailService.sendVerificationEmail(user.email, code, user.fullName);
    if (user.phoneNumber) {
      WhatsAppService.sendVerificationCode(user.phoneNumber, code, user.fullName);
    }
    return { message: 'Verification code resent successfully' };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('User with this email was not found');
    }

    const resetCode = PasswordUtil.generate6DigitCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordCode: resetCode,
        resetPasswordExpires: expiresAt,
      },
    });

    EmailService.sendPasswordResetEmail(user.email, resetCode);
    return { message: 'Password reset code sent to email' };
  }

  static async resetPassword(code: string, newPasswordStr: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordCode: code,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset code');
    }

    const hashedPassword = await PasswordUtil.hash(newPasswordStr);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordCode: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        business: {
          include: {
            shops: true,
            subscription: {
              include: { plan: true },
            },
          },
        },
        shop: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { password, verificationCode, resetPasswordCode, ...userProfile } = user;
    return userProfile;
  }
}
