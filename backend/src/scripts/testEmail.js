/**
 * @file testEmail.js
 * @description Quick utility to test real email dispatch via configured SMTP.
 */

import { emailService } from '../services/email.service.js';
import { env } from '../config/env.js';

async function testDispatch() {
  const recipient = env.SMTP_USER;
  console.log(`🚀 Sending test email to ${recipient} using SMTP Host: ${env.SMTP_HOST}:${env.SMTP_PORT}...`);

  const result = await emailService.sendWelcomeOnboardingEmail(
    recipient,
    'Muhammad Hamza',
    'TestPass@2026'
  );

  if (result.success) {
    console.log(`✅ Email sent successfully! Message ID: ${result.messageId}`);
    console.log('📬 Please check your Gmail Inbox (or Spam folder).');
  } else {
    console.error(`❌ Failed to send email:`, result.error);
  }
  process.exit(0);
}

testDispatch();
