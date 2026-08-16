import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { PaystackService } from '../services/paystack.service';
import { ApiResponse } from '../utils/response.util';

export class PaystackController {
  /**
   * POST /api/v1/subscriptions/paystack/initialize
   * Initialize a Paystack payment session for KSh 1,000 monthly subscription renewal
   */
  static async initializeSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const email = req.user?.email;

      if (!businessId || !email) {
        return ApiResponse.error(res, 'Authenticated business and email required', 400);
      }

      const result = await PaystackService.initializeSubscriptionPayment(businessId, email);
      return ApiResponse.success(res, result, 'Payment session initialized');
    } catch (err: any) {
      console.error('[Paystack] Initialization error:', err);
      return ApiResponse.error(res, err.message || 'Failed to initialize payment', 400);
    }
  }

  /**
   * GET /api/v1/subscriptions/paystack/verify/:reference
   * Verify a transaction after user completes payment on Paystack
   */
  static async verifyPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { reference } = req.params;
      if (!reference) {
        return ApiResponse.error(res, 'Transaction reference is required', 400);
      }

      const result = await PaystackService.verifyAndActivatePayment(reference);
      return ApiResponse.success(res, result, 'Subscription activated successfully');
    } catch (err: any) {
      console.error('[Paystack] Verification error:', err);
      return ApiResponse.error(res, err.message || 'Failed to verify payment', 400);
    }
  }

  /**
   * POST /api/v1/subscriptions/paystack/webhook
   * Paystack webhook handler for automated background confirmation
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const event = req.body;

      if (!signature) {
        return res.status(400).send('No signature provided');
      }

      // Process charge.success event
      if (event && event.event === 'charge.success') {
        const reference = event.data?.reference;
        if (reference) {
          console.log(`[Paystack Webhook] Processing successful charge for ref: ${reference}`);
          await PaystackService.verifyAndActivatePayment(reference);
        }
      }

      // Always return 200 OK to Paystack
      return res.status(200).json({ status: true });
    } catch (err: any) {
      console.error('[Paystack Webhook] Error processing event:', err);
      return res.status(200).json({ status: true, error: err.message });
    }
  }
}
