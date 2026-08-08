import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { prisma } from '../config/db';
import { ApiResponse } from '../utils/response.util';
import { SubscriptionStatus } from '@prisma/client';

export async function checkSubscriptionPaywall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const businessId = req.user?.businessId;

    // Super Admin bypasses tenant paywall
    if (req.user?.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!businessId) {
      return ApiResponse.error(res, 'Business context missing.', 400);
    }

    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId },
      include: { plan: true },
    });

    if (!subscription) {
      return res.status(402).json({
        success: false,
        message: 'No active subscription found for this business. Please subscribe to a plan to continue.',
        paywall: {
          reason: 'NO_SUBSCRIPTION',
          actionRequired: 'SUBSCRIBE',
        },
      });
    }

    const isExpired = new Date() > new Date(subscription.endDate);

    if (isExpired && subscription.status !== SubscriptionStatus.ACTIVE) {
      return res.status(402).json({
        success: false,
        message: `Your subscription ('${subscription.plan.name}') has expired. Please upgrade or renew your plan to perform this action.`,
        paywall: {
          reason: subscription.status === SubscriptionStatus.TRIALING ? 'TRIAL_EXPIRED' : 'SUBSCRIPTION_EXPIRED',
          planName: subscription.plan.name,
          planCode: subscription.plan.code,
          expiredAt: subscription.endDate,
          actionRequired: 'UPGRADE_OR_RENEW',
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
