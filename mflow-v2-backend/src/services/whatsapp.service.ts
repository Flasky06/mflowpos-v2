import { ENV } from '../config/env';

export class WhatsAppService {
  /**
   * Format phone number to numbers only (e.g. 254712345678)
   */
  private static getDigitsOnly(phone: string): string {
    let cleaned = phone.replace(/[^0-9]/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  /**
   * Send 6-Digit OTP Verification Code via OpenWA Gateway or UltraMsg API
   */
  static async sendVerificationCode(phone: string, code: string, fullName: string) {
    const digitsOnly = this.getDigitsOnly(phone);
    const message = `Welcome to mFlow POS, ${fullName}!\n\nYour 6-digit confirmation code is: *${code}*\n\nValid for 10 minutes. Do not share this code.`;

    // 1. Dispatch via OpenWA Docker Gateway if configured
    if (ENV.OPENWA_BASE_URL && ENV.OPENWA_API_KEY && ENV.OPENWA_SESSION_ID) {
      const chatId = `${digitsOnly}@c.us`;
      const url = `${ENV.OPENWA_BASE_URL.replace(/\/+$/, '')}/api/sessions/${ENV.OPENWA_SESSION_ID}/messages/send-text`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': ENV.OPENWA_API_KEY,
          },
          body: JSON.stringify({
            chatId,
            text: message,
          }),
        });

        const resData: any = await response.json();
        console.log(`[WhatsApp OpenWA] OTP sent to ${chatId}. Message ID:`, resData?.messageId || resData);
        return;
      } catch (err: any) {
        console.error(`[WhatsApp OpenWA] Failed to send to ${chatId}:`, err.message || err);
      }
    }

    // 2. Fallback to UltraMsg API if configured
    if (ENV.ULTRAMSG_INSTANCE_ID && ENV.ULTRAMSG_TOKEN) {
      const formattedPhone = `+${digitsOnly}`;
      const url = `https://api.ultramsg.com/${ENV.ULTRAMSG_INSTANCE_ID}/messages/chat`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: ENV.ULTRAMSG_TOKEN,
            to: formattedPhone,
            body: message,
          }),
        });

        const resData: any = await response.json();
        console.log(`[WhatsApp UltraMsg] OTP sent to ${formattedPhone}. Response:`, resData);
        return;
      } catch (err: any) {
        console.error(`[WhatsApp UltraMsg] Failed to send to ${formattedPhone}:`, err.message || err);
      }
    }

    // 3. Fallback to Server Console Mock Log
    console.log(`[WhatsApp Service Mock] Code for ${phone} (${fullName}): ${code}`);
  }
}
