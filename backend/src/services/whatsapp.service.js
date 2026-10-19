/**
 * @file whatsapp.service.js
 * @description WhatsApp Cloud API Gateway & Sandbox Adapter (Module M8 / Slice 8.4).
 * 
 * SPECIFICATION & REGIONAL INTEGRITY:
 * - Module: M8 Notifications & Announcements (BUILD-GUIDE Section 9 · Row 8.4)
 * - Regional Dialing: Formats Pakistani mobile numbers (03XXXXXXXXX, 923XXXXXXXXX)
 *   into standard international E.164 format (+923XXXXXXXXX).
 * - Multi-Channel Fallback: In development, test, or when API credentials are absent,
 *   logs structured payload to sandbox logger without interrupting runtime pipeline.
 */

import { env } from '../config/env.js';

class WhatsAppService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v21.0';
    this.token = process.env.WHATSAPP_TOKEN || null;
    this.phoneId = process.env.WHATSAPP_PHONE_ID || null;
  }

  /**
   * Format Pakistani and international phone numbers into clean E.164 format
   * 
   * @param {string} phone
   * @returns {string} E.164 formatted number (e.g. +923001234567)
   */
  formatPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '';

    // Strip whitespace, hyphens, and parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Convert local Pakistani format 03XXXXXXXXX to +923XXXXXXXXX
    if (/^03\d{9}$/.test(cleaned)) {
      return `+92${cleaned.substring(1)}`;
    }

    // Convert 923XXXXXXXXX to +923XXXXXXXXX
    if (/^923\d{9}$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    // Add + prefix if missing for international numbers
    if (!cleaned.startsWith('+') && cleaned.length >= 10) {
      return `+${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Send WhatsApp text or template message
   * 
   * @param {Object} options
   * @param {string} options.to - Recipient phone number
   * @param {string} options.message - Text body
   * @param {string} [options.templateName] - Meta approved template identifier
   * @param {Array} [options.templateData] - Template parameter components
   * @returns {Promise<{ success: boolean, messageId?: string, formattedPhone: string, error?: string }>}
   */
  async sendWhatsAppMessage({ to, message, templateName, templateData = [] }) {
    const formattedPhone = this.formatPhoneNumber(to);

    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid or missing phone number',
        formattedPhone: ''
      };
    }

    // If Cloud API credentials are configured, execute external HTTPS dispatch
    if (this.token && this.phoneId) {
      try {
        const payload = templateName
          ? {
              messaging_product: 'whatsapp',
              to: formattedPhone.replace('+', ''),
              type: 'template',
              template: {
                name: templateName,
                language: { code: 'en' },
                components: templateData
              }
            }
          : {
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: formattedPhone.replace('+', ''),
              type: 'text',
              text: { preview_url: false, body: message }
            };

        const res = await fetch(`${this.apiUrl}/${this.phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message || `WhatsApp Cloud API error (${res.status})`);
        }

        return {
          success: true,
          messageId: data.messages?.[0]?.id || `wa-${Date.now()}`,
          formattedPhone
        };
      } catch (err) {
        console.error('[WhatsAppService] API dispatch error:', err.message);
        return {
          success: false,
          error: err.message,
          formattedPhone
        };
      }
    }

    // Development & Test Sandbox Logger Fallback (Zero network failure risk)
    console.log(`📱 [MOCK WHATSAPP SANDBOX] To: ${formattedPhone} | Message: ${message}`);
    return {
      success: true,
      messageId: `wa-mock-${Date.now()}`,
      formattedPhone
    };
  }
}

export const whatsappService = new WhatsAppService();
