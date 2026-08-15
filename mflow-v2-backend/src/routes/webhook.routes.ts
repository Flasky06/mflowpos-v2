import { Router, Request, Response } from 'express';
import { ApiResponse } from '../utils/response.util';

const router = Router();

/**
 * Handle Inbound WhatsApp Webhook Notifications (OpenWA / UltraMsg)
 */
router.post('/whatsapp', async (req: Request, res: Response) => {
  const payload = req.body;
  console.log('[WhatsApp Webhook Event Received]:', JSON.stringify(payload, null, 2));

  // Acknowledge receipt immediately to avoid gateway retries
  return ApiResponse.success(res, { received: true }, 'Webhook event processed');
});

export default router;
