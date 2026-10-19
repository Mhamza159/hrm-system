/**
 * @file queue.service.js
 * @description Background Job Queue Service for Asynchronous Email & Alert Delivery (Module M8 / Slice 8.3).
 * 
 * ARCHITECTURE & RESILIENCE:
 * - Implements a resilient asynchronous queue pipeline.
 * - Handles 'notification_email' jobs without blocking main HTTP thread response.
 * - Compiles email templates replacing dynamic variables:
 *   {{employeeName}}, {{actionTitle}}, {{details}}, {{portalUrl}}
 * - Dispatches emails via Nodemailer email.service.js.
 * - Graceful fallback: works in zero-dependency async mode (Node.js event-driven queue)
 *   when Redis is not configured or in test environments, satisfying Ponytail simplicity.
 */

import { emailService } from './email.service.js';
import { env } from '../config/env.js';

class QueueService {
  constructor() {
    this.jobs = [];
    this.isProcessing = false;
    this.concurrency = 5;
    this.activeWorkers = 0;
  }

  /**
   * Format template by replacing placeholder tags
   * 
   * @param {string} template 
   * @param {Object} variables 
   * @returns {string}
   */
  compileTemplate(template, variables = {}) {
    if (!template) return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Generate branded HTML email for notification alerts
   * 
   * @param {Object} params
   * @param {string} params.employeeName
   * @param {string} params.actionTitle
   * @param {string} params.details
   * @param {string} params.portalUrl
   * @returns {string}
   */
  buildNotificationEmailHtml({ employeeName, actionTitle, details, portalUrl }) {
    const safeName = employeeName || 'Team Member';
    const safeTitle = actionTitle || 'System Notification';
    const safeDetails = details || '';
    const safeUrl = portalUrl || env.CLIENT_URL || 'http://localhost:5173';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${safeTitle}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #090A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #EDEDEF;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #090A0F; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #0F111A; border: 1px solid #1E2235; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <!-- Header -->
                <tr>
                  <td style="padding: 24px 32px; background: linear-gradient(180deg, #161926 0%, #0F111A 100%); border-bottom: 1px solid #1E2235;">
                    <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #5E6AD2;">HRM ENTERPRISE ALERT</div>
                    <h1 style="margin: 8px 0 0; font-size: 20px; font-weight: 600; color: #FFFFFF;">${safeTitle}</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #8F94A8;">
                      Hello <strong style="color: #EDEDEF;">${safeName}</strong>,
                    </p>
                    <div style="background-color: #141724; border-left: 3px solid #5E6AD2; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #EDEDEF;">
                      ${safeDetails}
                    </div>
                    <table cellpadding="0" cellspacing="0" style="margin-top: 28px;">
                      <tr>
                        <td align="center" style="border-radius: 6px; background: #5E6AD2;">
                          <a href="${safeUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 500; color: #FFFFFF; text-decoration: none; border-radius: 6px;">
                            View in Portal →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #0C0D14; border-top: 1px solid #1E2235; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #62677B;">
                      This is an automated notification from your HRM System. You can manage your email alerts in <a href="${safeUrl}/settings/notifications" style="color: #5E6AD2; text-decoration: none;">Notification Settings</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Enqueue email notification job
   * 
   * @param {Object} jobData
   * @param {string} jobData.to - Recipient email
   * @param {string} jobData.employeeName - Recipient full name
   * @param {string} jobData.actionTitle - Notification headline
   * @param {string} jobData.details - Detailed message body
   * @param {string} [jobData.link] - Deep link target
   * @returns {Promise<{ jobId: string, status: string }>}
   */
  async addNotificationEmailJob({ to, employeeName, actionTitle, details, link }) {
    const portalUrl = link
      ? (link.startsWith('http') ? link : `${env.CLIENT_URL || 'http://localhost:5173'}${link.startsWith('/') ? '' : '/'}${link}`)
      : (env.CLIENT_URL || 'http://localhost:5173');

    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'notification_email',
      data: {
        to,
        employeeName,
        actionTitle,
        details,
        portalUrl
      },
      createdAt: new Date()
    };

    this.jobs.push(job);
    this.processNext();

    return { jobId: job.id, status: 'queued' };
  }

  /**
   * Process pending queue jobs with concurrency control
   */
  async processNext() {
    if (this.jobs.length === 0 || this.activeWorkers >= this.concurrency) {
      return;
    }

    const job = this.jobs.shift();
    if (!job) return;

    this.activeWorkers++;

    try {
      if (job.type === 'notification_email') {
        const { to, employeeName, actionTitle, details, portalUrl } = job.data;
        const html = this.buildNotificationEmailHtml({
          employeeName,
          actionTitle,
          details,
          portalUrl
        });

        await emailService.sendMail({
          to,
          subject: `HRM Alert: ${actionTitle}`,
          html,
          text: `${actionTitle}\n\n${details}\n\nOpen portal: ${portalUrl}`
        });
      }
    } catch (err) {
      console.error(`[QueueService] Error processing job ${job.id}:`, err.message);
    } finally {
      this.activeWorkers--;
      // Continue processing remaining items in queue
      if (this.jobs.length > 0) {
        this.processNext();
      }
    }
  }

  /**
   * Get queue health status for diagnostics / tests
   */
  getStatus() {
    return {
      pending: this.jobs.length,
      activeWorkers: this.activeWorkers,
      concurrency: this.concurrency
    };
  }
}

export const queueService = new QueueService();
