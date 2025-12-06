/**
 * Firebase Email Handler (Vercel Serverless Function)
 * 
 * Handles email sending via Firebase Cloud Messaging or third-party email service.
 * 
 * Endpoints:
 * - POST /api/send-email: Send email (requires Firebase Cloud Function backend)
 * - POST /api/send-email-sendgrid: Send via SendGrid (alternative)
 * 
 * Environment variables required:
 * - SENDGRID_API_KEY (optional, for SendGrid alternative)
 * - SENDER_EMAIL (optional, for SendGrid)
 */

// For Vercel: use generic types for compatibility
type VercelRequest = any;
type VercelResponse = any;

interface EmailPayload {
  recipientEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: string;
}

/**
 * POST /api/send-email
 * Primary email handler using Firebase Cloud Function or direct integration
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload: EmailPayload = req.body;

    // Validate required fields
    if (!payload.recipientEmail || !payload.subject || !payload.bodyText) {
      return res.status(400).json({
        error: 'Missing required fields: recipientEmail, subject, bodyText'
      });
    }

    // Validate sender email if provided
    if (payload.senderEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payload.senderEmail)) {
        return res.status(400).json({
          error: 'Invalid sender email address'
        });
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.recipientEmail)) {
      return res.status(400).json({
        error: 'Invalid recipient email address'
      });
    }

    // TODO: Integrate with Firebase Cloud Function or third-party email service
    // 
    // Option 1: Firebase Cloud Messaging + Node.js backend
    // - Admin SDK call to send via FCM topic
    // - Requires Service Account credentials
    // 
    // Option 2: SendGrid API
    // - Uses SENDGRID_API_KEY
    // - payload.senderEmail is business's email (use as 'from')
    // - See sendEmailViaSendGrid() below
    // 
    // Option 3: Firebase Extensions (Recommended)
    // - Use Firebase Email extension from Marketplace
    // - Triggered automatically by Firestore writes
    // - Write payload.senderEmail to Firestore for extension to use

    // Placeholder response
    console.log('Email request:', {
      to: payload.recipientEmail,
      from: payload.senderEmail || 'noreply@finishoutnow.app',
      senderName: payload.senderName,
      subject: payload.subject
    });

    // For now, return a mock success response
    // In production, implement actual email delivery
    return res.status(202).json({
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Email queued for delivery. (Mock response - configure Firebase Email extension or SendGrid)',
      recipient: payload.recipientEmail
    });
  } catch (error) {
    console.error('Email handler error:', error);
    return res.status(500).json({
      error: 'Failed to process email request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Alternative: SendGrid Email Handler
 * 
 * Requires: npm install @sendgrid/mail
 * Environment: SENDGRID_API_KEY, SENDER_EMAIL
 */
export async function sendEmailViaSendGrid(payload: EmailPayload): Promise<any> {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@finishoutnow.app';

  if (!sendgridApiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  try {
    // Uncomment when @sendgrid/mail is installed
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(sendgridApiKey);

    const msg = {
      to: payload.recipientEmail,
      from: {
        email: senderEmail,
        name: payload.senderName || 'FinishOutNow'
      },
      replyTo: payload.replyTo || senderEmail,
      subject: payload.subject,
      text: payload.bodyText,
      html: payload.bodyHtml || payload.bodyText
    };

    const result = await sgMail.send(msg);
    return {
      success: true,
      messageId: result[0].headers['x-message-id']
    };
    */

    throw new Error('SendGrid integration requires @sendgrid/mail package');
  } catch (error) {
    console.error('SendGrid error:', error);
    throw error;
  }
}

/**
 * Firebase Extensions Email Handler
 * 
 * Recommended approach: Use Firebase Extensions
 * 1. In Firebase Console: Extensions → Search for "Trigger Email from Firestore"
 * 2. Install the extension
 * 3. Configure sender email
 * 4. Write to Firestore collection (e.g., "mail" collection)
 * 
 * Example Firestore write:
 * ```
 * firestore.collection('mail').add({
 *   to: payload.recipientEmail,
 *   message: {
 *     subject: payload.subject,
 *     text: payload.bodyText,
 *     html: payload.bodyHtml
 *   }
 * })
 * ```
 */
