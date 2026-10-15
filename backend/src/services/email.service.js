/**
 * @file email.service.js
 * @description Enterprise Email Service powered by Nodemailer.
 * 
 * SPECIFICATION & USE CASES:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.9)
 * - Use cases:
 *   1. M1 Authentication: 6-digit OTP delivery for password reset (Slice 1.7) & 2FA (Slice 1.10).
 *   2. M1 Administration: Temporary password delivery upon HR account reset (Slice 1.14).
 *   3. M3 Employee Onboarding: Welcome emails with credentials (Slice 3.2).
 *   4. M9 Payroll: Monthly branded PDF payslip delivery (Slice 9.11).
 * - Fallback: In development or test without an active SMTP server, logs message to console rather than throwing.
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  /**
   * Initialize SMTP connection pool or mock logger
   */
  initTransporter() {
    if (env.SMTP_HOST && env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      });
    } else {
      // Development & test mock logger
      this.transporter = {
        sendMail: async (options) => {
          console.log(`📧 [MOCK EMAIL] To: ${options.to} | Subject: ${options.subject}`);
          return { messageId: `mock-${Date.now()}` };
        }
      };
    }
  }

  /**
   * Universal email dispatcher
   * @param {Object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject line
   * @param {string} options.html - HTML body
   * @param {string} [options.text] - Plaintext fallback
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendMail({ to, subject, html, text }) {
    try {
      const info = await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, '')
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dispatch 6-digit verification OTP (M1 Slices 1.7 & 1.10)
   * @param {string} to - Recipient email
   * @param {string} otp - 6-digit numeric OTP code
   * @param {string} [purpose='Password Reset'] - Context of OTP request
   * @returns {Promise<Object>}
   */
  async sendOtpEmail(to, otp, purpose = 'Password Reset') {
    const subject = `HRM System — ${purpose} Code: ${otp}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">HRM Enterprise Security</h2>
        <p style="color: #475569; font-size: 14px;">You have requested a <strong>${purpose}</strong> verification code.</p>
        <div style="background-color: #f1f5f9; padding: 18px; border-radius: 6px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4f46e5; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this, please notify your HR administrator immediately.</p>
      </div>
    `;
    return this.sendMail({ to, subject, html });
  }

  /**
   * Dispatch administrative temporary password (M1 Slice 1.14)
   * @param {string} to - Recipient email
   * @param {string} tempPassword - Generated temporary password
   * @returns {Promise<Object>}
   */
  async sendTemporaryPasswordEmail(to, tempPassword) {
    const subject = 'HRM System — Your Temporary Login Password';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">HRM Enterprise Account</h2>
        <p style="color: #475569; font-size: 14px;">An administrator has reset your account password. Use the following temporary password to sign in:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0;">
          <code style="font-size: 18px; font-weight: 600; color: #0f172a;">${tempPassword}</code>
        </div>
        <p style="color: #b45309; font-size: 13px; font-weight: 500;">You will be required to choose a new password upon your initial sign-in.</p>
      </div>
    `;
    return this.sendMail({ to, subject, html });
  }

  /**
   * Dispatch employee welcome onboarding email with login credentials (M3 Slice 3.2)
   * @param {string} to - Employee email
   * @param {string} name - Employee full name
   * @param {string} tempPassword - Generated initial temporary password
   * @returns {Promise<Object>}
   */
  async sendWelcomeOnboardingEmail(to, name, tempPassword) {
    const subject = 'Welcome to the Team — Your HRM Portal Login Credentials';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #00C471; margin-top: 0;">Welcome to the Company, ${name}!</h2>
        <p style="color: #334155; font-size: 14px;">Your employee profile and HRM self-service account have been set up successfully.</p>
        <div style="background-color: #f8fafc; border: 1px solid #eaecf0; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Portal URL:</strong> <a href="${env.CLIENT_URL}" style="color: #00C471;">${env.CLIENT_URL}</a></p>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Username:</strong> ${to}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Temporary Password:</strong> <code style="font-weight: 600; color: #0f172a;">${tempPassword}</code></p>
        </div>
        <p style="color: #b45309; font-size: 13px;">For security, you will be prompted to change your password immediately upon your first sign in.</p>
      </div>
    `;
    return this.sendMail({ to, subject, html });
  }
}

export const emailService = new EmailService();

