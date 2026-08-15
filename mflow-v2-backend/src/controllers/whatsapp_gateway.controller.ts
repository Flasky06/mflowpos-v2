import { Response } from 'express';
import { z } from 'zod';
import { OpenWAService } from '../services/openwa.service';
import { ApiResponse } from '../utils/response.util';
import { SuperAdminAuthenticatedRequest } from '../middlewares/superadmin_auth.middleware';

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const createSessionSchema = z.object({
  name: z
    .string()
    .min(3, 'Session name must be at least 3 characters')
    .max(50, 'Session name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9-]+$/, 'Session name may only contain letters, numbers, and hyphens'),
  config: z
    .object({
      autoRejectCalls: z.boolean().optional(),
      maxReconnectAttempts: z.number().int().min(0).max(20).optional(),
      reconnectBaseDelay: z.number().int().min(1000).max(300000).optional(),
    })
    .optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class WhatsAppGatewayController {
  /** GET /superadmin/whatsapp/ping — check if OpenWA is reachable */
  static async ping(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const result = await OpenWAService.ping();
      const msg = !result.configured
        ? 'OpenWA is not configured. Set OPENWA_BASE_URL and OPENWA_API_KEY in .env'
        : result.reachable
        ? 'OpenWA gateway is reachable'
        : 'OpenWA gateway is configured but not reachable';
      return ApiResponse.success(res, result, msg);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 500);
    }
  }

  /** GET /superadmin/whatsapp/sessions — list all OpenWA sessions */
  static async listSessions(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const sessions = await OpenWAService.listSessions();
      return ApiResponse.success(res, sessions, 'Sessions retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 500);
    }
  }

  /** POST /superadmin/whatsapp/sessions — create a new session */
  static async createSession(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const { name, config } = req.body;
      const session = await OpenWAService.createSession(name, config);
      return ApiResponse.success(res, session, `Session '${name}' created. Scan the QR code to connect.`, 201);
    } catch (err: any) {
      // 409 = name already taken on the OpenWA side
      const status = err.message.startsWith('OpenWA 409') ? 409 : 500;
      return ApiResponse.error(res, err.message, status);
    }
  }

  /** GET /superadmin/whatsapp/sessions/:sessionId — get one session */
  static async getSession(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const session = await OpenWAService.getSession(req.params.sessionId);
      return ApiResponse.success(res, session, 'Session details retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 404);
    }
  }

  /**
   * GET /superadmin/whatsapp/sessions/:sessionId/qr
   * Returns the QR code (base64 data-URI or raw string) for a session in qr_ready state.
   */
  static async getQr(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const qr = await OpenWAService.getSessionQr(req.params.sessionId);
      return ApiResponse.success(res, { qr }, 'QR code ready — scan with WhatsApp');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  /** POST /superadmin/whatsapp/sessions/:sessionId/start — start a stopped session */
  static async startSession(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      const session = await OpenWAService.startSession(req.params.sessionId);
      return ApiResponse.success(res, session, 'Session start initiated');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  /** POST /superadmin/whatsapp/sessions/:sessionId/stop — stop without deleting */
  static async stopSession(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      await OpenWAService.stopSession(req.params.sessionId);
      return ApiResponse.success(res, null, 'Session stopped');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  /** POST /superadmin/whatsapp/sessions/:sessionId/logout — logout (clears credentials) */
  static async logoutSession(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      await OpenWAService.logoutSession(req.params.sessionId);
      return ApiResponse.success(res, null, 'Session logged out — re-scan QR to reconnect');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }

  /** DELETE /superadmin/whatsapp/sessions/:sessionId — permanently remove session */
  static async deleteSession(req: SuperAdminAuthenticatedRequest, res: Response) {
    try {
      await OpenWAService.deleteSession(req.params.sessionId);
      return ApiResponse.success(res, null, 'Session permanently deleted');
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 400);
    }
  }
}
