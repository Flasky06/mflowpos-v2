import { Resend } from 'resend';
import { ENV } from '../config/env';

export class EmailService {
  private static resend = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

  static async sendVerificationEmail(to: string, code: string, fullName: string) {
    if (!this.resend) {
      console.log(`[Email Mock] Verification code for ${to}: ${code}`);
      return;
    }

    const { data, error } = await this.resend.emails.send({
      from: `${ENV.FROM_NAME} <${ENV.FROM_EMAIL}>`,
      to,
      subject: 'Verify Your Email - mflow POS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #111;">Welcome to mflow POS, ${fullName}!</h2>
          <p style="color: #555;">Your email verification code is:</p>
          <div style="background: #f4f4f5; padding: 16px 24px; display: inline-block; letter-spacing: 8px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #111;">${code}</div>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">This code expires in 24 hours. Do not share it with anyone.</p>
        </div>
      `,
    });

    if (error) {
      console.error(`[Email] Failed to send verification email to ${to}:`, JSON.stringify(error));
    } else {
      console.log(`[Email] Verification email sent to ${to}. ID: ${data?.id}`);
    }
  }

  static async sendPasswordResetEmail(to: string, code: string) {
    if (!this.resend) {
      console.log(`[Email Mock] Password reset code for ${to}: ${code}`);
      return;
    }

    const { data, error } = await this.resend.emails.send({
      from: `${ENV.FROM_NAME} <${ENV.FROM_EMAIL}>`,
      to,
      subject: 'Password Reset Code - mflow POS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #111;">Password Reset Request</h2>
          <p style="color: #555;">Use the following 6-digit code to reset your password:</p>
          <div style="background: #f4f4f5; padding: 16px 24px; display: inline-block; letter-spacing: 8px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #111;">${code}</div>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error(`[Email] Failed to send password reset email to ${to}:`, JSON.stringify(error));
    } else {
      console.log(`[Email] Password reset email sent to ${to}. ID: ${data?.id}`);
    }
  }

  static async sendBroadcastEmail(to: string, subject: string, content: string) {
    if (!this.resend) {
      console.log(`[Email Mock] Broadcast email to ${to}: ${subject}`);
      return;
    }

    const { data, error } = await this.resend.emails.send({
      from: `${ENV.FROM_NAME} <${ENV.FROM_EMAIL}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #09090b; font-size: 20px; font-weight: bold; margin-bottom: 16px;">${subject}</h2>
          <div style="color: #3f3f46; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${content}</div>
          <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 11px; margin: 0;">Sent by mFlow POS Platform Administration</p>
        </div>
      `,
    });

    if (error) {
      console.error(`[Email] Failed to send broadcast to ${to}:`, JSON.stringify(error));
    } else {
      console.log(`[Email] Broadcast email sent to ${to}. ID: ${data?.id}`);
    }
  }
}
