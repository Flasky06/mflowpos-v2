import crypto from 'crypto';
import { prisma } from '../config/db';
import { ENV } from '../config/env';
import { SubscriptionStatus } from '@prisma/client';

export class PaystackService {
  private static baseUrl = 'https://api.paystack.co';

  /**
   * Initialize a Paystack checkout transaction for business subscription renewal (KSh 1,000 / mo)
   */
  static async initializeSubscriptionPayment(businessId: string, email: string, amountKes = 1000) {
    if (!ENV.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key is not configured');
    }

    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId },
      include: { plan: true },
    });

    let finalAmount = amountKes;
    if (subscription?.customPrice !== null && subscription?.customPrice !== undefined) {
      finalAmount = Number(subscription.customPrice);
    } else if (subscription?.plan) {
      finalAmount = Number(subscription.plan.price);
    }

    const amountInCents = Math.round(finalAmount * 100); // Paystack expects amount in KES cents (e.g. 1000 KES = 100000)

    const payload = {
      email,
      amount: amountInCents,
      currency: 'KES',
      channels: ['card', 'mobile_money'],
      callback_url: `${ENV.FRONTEND_URL}/dashboard?payment=success`,
      metadata: {
        businessId,
        planCode: 'STANDARD',
        planName: 'mflow POS Standard (Monthly)',
        custom_fields: [
          {
            display_name: 'Business ID',
            variable_name: 'business_id',
            value: businessId,
          },
          {
            display_name: 'Product',
            variable_name: 'product_plan',
            value: 'mflow POS Standard Subscription',
          },
        ],
      },
    };

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(data.message || 'Failed to initialize Paystack payment');
    }

    return {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  }

  /**
   * Verify a completed Paystack transaction reference and renew business subscription
   */
  static async verifyAndActivatePayment(reference: string) {
    if (!ENV.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key is not configured');
    }

    const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data: any = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(data.message || 'Payment verification failed');
    }

    const txData = data.data;

    if (txData.status !== 'success') {
      return {
        success: false,
        status: txData.status,
        message: `Payment status is ${txData.status}`,
      };
    }

    const businessId = txData.metadata?.businessId;
    if (!businessId) {
      throw new Error('Business ID missing from Paystack transaction metadata');
    }

    const amountPaid = Number(txData.amount) / 100; // Convert back from cents to KES
    const channel = txData.channel || 'PAYSTACK';

    // Atomic renewal transaction: Add 30 days to active/new subscription
    return prisma.$transaction(async (tx) => {
      const standardPlan = await tx.subscriptionPlan.findUnique({
        where: { code: 'STANDARD' },
      });

      const existingSub = await tx.businessSubscription.findUnique({
        where: { businessId },
      });

      let baseDate = new Date();
      if (existingSub && existingSub.endDate && new Date(existingSub.endDate) > new Date()) {
        // If current subscription is still active, append 30 days from the current end date
        baseDate = new Date(existingSub.endDate);
      }

      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + 30);

      const subscription = await tx.businessSubscription.upsert({
        where: { businessId },
        create: {
          businessId,
          planId: standardPlan?.id || '',
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
          endDate: newEndDate,
        },
        update: {
          status: SubscriptionStatus.ACTIVE,
          endDate: newEndDate,
          ...(standardPlan ? { planId: standardPlan.id } : {}),
        },
      });

      // Ensure business is active
      await tx.business.update({
        where: { id: businessId },
        data: { active: true },
      });

      // Record completed payment if not already recorded
      const existingPayment = await tx.subscriptionPayment.findFirst({
        where: { transactionRef: reference },
      });

      if (!existingPayment) {
        await tx.subscriptionPayment.create({
          data: {
            businessSubscriptionId: subscription.id,
            amount: amountPaid,
            paymentMethod: channel.toUpperCase(),
            transactionRef: reference,
            status: 'COMPLETED',
          },
        });
      }

      return {
        success: true,
        message: 'Subscription successfully activated for 30 days',
        subscription,
        paidAmount: amountPaid,
        channel,
      };
    });
  }

  /**
   * Verify HMAC signature from Paystack webhook event
   */
  static verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    if (!ENV.PAYSTACK_SECRET_KEY) return false;
    const hash = crypto
      .createHmac('sha512', ENV.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  }
}
