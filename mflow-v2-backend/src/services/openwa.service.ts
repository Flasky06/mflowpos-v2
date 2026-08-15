import { ENV } from '../config/env';

interface OpenWASession {
  id: string;
  name: string;
  status: 'created' | 'initializing' | 'qr_ready' | 'authenticating' | 'ready' | 'disconnected' | 'action_required' | 'failed';
  phone: string | null;
  pushName: string | null;
  connectedAt: string | null;
  lastActive: string | null;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  engineLoaded: boolean;
}

interface OpenWAQrResponse {
  qr: string;          // base64-encoded QR image or raw string
  format: string;      // 'image/png' or 'string'
}

export class OpenWAService {
  /** Base URL of the running OpenWA instance (e.g. http://localhost:2785) */
  private static get base(): string {
    return (ENV.OPENWA_BASE_URL || '').replace(/\/+$/, '');
  }

  private static get apiKey(): string {
    return ENV.OPENWA_API_KEY || '';
  }

  private static get configured(): boolean {
    return !!(this.base && this.apiKey);
  }

  /** Shared fetch wrapper — always injects X-API-Key */
  private static async request<T>(
    method: string,
    path: string,
    body?: object
  ): Promise<T> {
    if (!this.configured) {
      throw new Error('OpenWA gateway is not configured. Set OPENWA_BASE_URL and OPENWA_API_KEY in .env');
    }

    const url = `${this.base}/api${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Treat 204 No Content as success with no body
    if (res.status === 204) return {} as T;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = (data as any)?.message || (data as any)?.error || res.statusText;
      throw new Error(`OpenWA ${res.status}: ${msg}`);
    }

    return data as T;
  }

  // ─── Session CRUD ────────────────────────────────────────────────────────

  /** List all sessions on the OpenWA instance */
  static async listSessions(): Promise<OpenWASession[]> {
    return this.request<OpenWASession[]>('GET', '/sessions');
  }

  /**
   * Create a new WhatsApp session.
   * @param name   Unique session name (alphanumeric + hyphens, 3-50 chars)
   * @param config Optional session config overrides
   */
  static async createSession(
    name: string,
    config?: {
      autoRejectCalls?: boolean;
      maxReconnectAttempts?: number;
      reconnectBaseDelay?: number;
    }
  ): Promise<OpenWASession> {
    return this.request<OpenWASession>('POST', '/sessions', {
      name,
      config: {
        autoRejectCalls: false,
        maxReconnectAttempts: 5,
        reconnectBaseDelay: 5000,
        ...config,
      },
    });
  }

  /** Get a single session by its name/id */
  static async getSession(sessionId: string): Promise<OpenWASession> {
    return this.request<OpenWASession>('GET', `/sessions/${sessionId}`);
  }

  /**
   * Get the QR code image for a session that is in `qr_ready` status.
   * Returns a base64 PNG data-URI string ready for <img src="..."> or
   * the raw QR string if the instance returns text format.
   */
  static async getSessionQr(sessionId: string): Promise<string> {
    const url = `${this.base}/api/sessions/${sessionId}/qr`;
    const res = await fetch(url, {
      headers: { 'X-API-Key': this.apiKey, Accept: 'image/png, application/json' },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data as any)?.message || res.statusText;
      throw new Error(`OpenWA QR ${res.status}: ${msg}`);
    }

    const contentType = res.headers.get('content-type') || '';

    // Binary PNG → convert to base64 data-URI
    if (contentType.includes('image/')) {
      const arrayBuf = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString('base64');
      return `data:${contentType};base64,${base64}`;
    }

    // JSON response with a qr field
    const data = await res.json() as OpenWAQrResponse;
    if (data.qr) return data.qr;

    throw new Error('OpenWA returned an unrecognized QR format');
  }

  /** Stop a running session (keeps it registered, engine unloaded) */
  static async stopSession(sessionId: string): Promise<void> {
    await this.request('POST', `/sessions/${sessionId}/stop`);
  }

  /** Logout + stop a session (clears saved credentials) */
  static async logoutSession(sessionId: string): Promise<void> {
    await this.request('POST', `/sessions/${sessionId}/logout`);
  }

  /** Permanently delete a session from the instance */
  static async deleteSession(sessionId: string): Promise<void> {
    await this.request('DELETE', `/sessions/${sessionId}`);
  }

  /** Start / restart a stopped session */
  static async startSession(sessionId: string): Promise<OpenWASession> {
    return this.request<OpenWASession>('POST', `/sessions/${sessionId}/start`);
  }

  /** Check whether the OpenWA gateway itself is reachable */
  static async ping(): Promise<{ reachable: boolean; configured: boolean }> {
    if (!this.configured) return { reachable: false, configured: false };
    try {
      await fetch(`${this.base}/api/infra/health`);
      return { reachable: true, configured: true };
    } catch {
      return { reachable: false, configured: true };
    }
  }
}
