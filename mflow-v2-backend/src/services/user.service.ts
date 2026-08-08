import { prisma } from '../config/db';
import { PasswordUtil } from '../utils/password.util';
import { Role } from '@prisma/client';

export class UserService {
  static async getUsers(businessId: string, shopId?: string) {
    const where: any = { businessId };
    if (shopId) where.shopId = shopId;

    const users = await prisma.user.findMany({
      where,
      include: {
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(({ password, verificationCode, resetPasswordCode, ...profile }) => profile);
  }

  static async createUser(
    businessId: string,
    dto: {
      fullName: string;
      email: string;
      password: string;
      role: Role;
      shopId?: string;
      customPermissions?: string[];
      phoneNumber?: string;
    }
  ) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await PasswordUtil.hash(dto.password);

    const user = await prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        role: dto.role,
        shopId: dto.shopId,
        phoneNumber: dto.phoneNumber,
        customPermissions: dto.customPermissions || [],
        businessId,
        verified: true, // Internal staff users are auto-verified
        active: true,
      },
      include: { shop: { select: { name: true } } },
    });

    const { password, verificationCode, resetPasswordCode, ...userProfile } = user;
    return userProfile;
  }

  static async updatePermissions(userId: string, businessId: string, customPermissions: string[]) {
    const user = await prisma.user.findFirst({
      where: { id: userId, businessId },
    });

    if (!user) {
      throw new Error('Staff user not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        customPermissions,
      },
      include: { shop: { select: { name: true } } },
    });

    const { password, verificationCode, resetPasswordCode, ...userProfile } = updated;
    return userProfile;
  }

  static async toggleUserStatus(userId: string, businessId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, businessId },
    });

    if (!user) {
      throw new Error('Staff user not found');
    }

    if (user.role === Role.ADMIN) {
      throw new Error('Cannot suspend Business Owner account');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { active: !user.active },
      include: { shop: { select: { name: true } } },
    });

    const { password, verificationCode, resetPasswordCode, ...userProfile } = updated;
    return userProfile;
  }

  static async deleteUser(userId: string, businessId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, businessId },
    });

    if (!user) {
      throw new Error('Staff user not found');
    }

    if (user.role === Role.ADMIN) {
      throw new Error('Cannot delete Business Owner user account');
    }

    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
