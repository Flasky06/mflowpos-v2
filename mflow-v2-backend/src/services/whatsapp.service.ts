import { ENV } from '../config/env';

export class WhatsAppService {
  /**
   * Format phone numbers into standard international format e.g. +254712345678
   */
  private static formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^0-9+]/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '+254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+') && cleaned.length === 9) {
      cleaned = '+254' + cleaned;
    } else if (!cleaned.startsWith('+') && cleaned.startsWith('254')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Send 6-Digit OTP Verification Code via UltraMsg WhatsApp API
   */
  static async sendVerificationCode(phone: string, code: string, fullName: string) {
    if (!ENV.ULTRAMSG_INSTANCE_ID || !ENV.ULTRAMSG_TOKEN) {
      console.log(`[WhatsApp Service Mock] UltraMsg credentials missing. Code for ${phone}: ${code}`);
      return;
    }

    const formattedPhone = this.formatPhoneNumber(phone);
    const message = `Welcome to mFlow POS, ${fullName}!\n\nYour 6-digit confirmation code is: *${code}*\n\nValid for 10 minutes. Do not share this code.`;

    try {
      const url = `https://api.ultramsg.com/${ENV.ULTRAMSG_INSTANCE_ID}/messages/chat`;
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

      const responseData = await response.json();
      console.log(`[WhatsApp UltraMsg] Verification OTP dispatched to ${formattedPhone}. Response:`, responseData);
    } catch (err: any) {
      console.error(`[WhatsApp UltraMsg] Failed to dispatch OTP to ${phone}:`, err.message || err);
    }
  }
}
