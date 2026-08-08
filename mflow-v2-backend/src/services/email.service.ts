import { Resend } from 'resend';
import { ENV } from '../config/env';

export class EmailService {
  private static resend = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

  static async sendVerificationEmail(to: string, code: string, fullName: string) {
    if (!this.resend) {
      console.log(`[Email Service Mock] Verification code for ${to} (${fullName}): ${code}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: `${ENV.FROM_NAME} <${ENV.FROM_EMAIL}>`,
        to,
        subject: 'Verify Your Email - mflow POS',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to mflow POS, ${fullName}!</h2>
            <p>Your email verification code is:</p>
            <h1 style="background: #f4f4f5; padding: 10px 20px; display: inline-block; letter-spacing: 4px; border-radius: 6px;">${code}</h1>
            <p>This code will expire in 24 hours.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error(`Failed to send verification email to ${to}:`, err);
    }
  }

  static async sendPasswordResetEmail(to: string, code: string) {
    if (!this.resend) {
      console.log(`[Email Service Mock] Password Reset code for ${to}: ${code}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: `${ENV.FROM_NAME} <${ENV.FROM_EMAIL}>`,
        to,
        subject: 'Reset Password Code - mflow POS',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Use the following 6-digit code to reset your password:</p>
            <h1 style="background: #f4f4f5; padding: 10px 20px; display: inline-block; letter-spacing: 4px; border-radius: 6px;">${code}</h1>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error(`Failed to send password reset email to ${to}:`, err);
    }
  }
}
