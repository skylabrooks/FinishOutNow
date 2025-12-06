/**
 * Firebase Cloud Messaging Email Service
 * 
 * Sends emails via Firebase Cloud Messaging (FCM) backend.
 * Requires a Cloud Function or backend service to handle FCM → Email delivery.
 * 
 * Typical flow:
 * 1. Frontend calls sendEmailViaBatch() or similar
 * 2. Data is sent to backend (Firebase Cloud Function or Node.js server)
 * 3. Backend uses FCM or SendGrid/Mailgun to deliver email
 */

interface EmailPayload {
  recipientEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: string;
}

interface CloudFunctionResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via Firebase Cloud Function
 * Backend Cloud Function: sendEmail(data)
 * - data.recipientEmail: recipient email address
 * - data.subject: email subject
 * - data.bodyText: plain text body
 * - data.bodyHtml: optional HTML body
 * 
 * Example Cloud Function (Node.js):
 * ```
 * const functions = require('firebase-functions');
 * const admin = require('firebase-admin');
 * const nodemailer = require('nodemailer');
 * 
 * const transporter = nodemailer.createTransport({...});
 * 
 * exports.sendEmail = functions.https.onCall(async (data, context) => {
 *   const mailOptions = {
 *     from: process.env.EMAIL_ADDRESS,
 *     to: data.recipientEmail,
 *     subject: data.subject,
 *     text: data.bodyText,
 *     html: data.bodyHtml || data.bodyText
 *   };
 *   return transporter.sendMail(mailOptions);
 * });
 * ```
 */
export const sendEmailViaCloudFunction = async (payload: EmailPayload): Promise<CloudFunctionResponse> => {
  try {
    // This assumes a Cloud Function named 'sendEmail' exists in your Firebase project
    // For now, return a placeholder response
    console.warn('Cloud Function email not yet implemented. Email would send:');
    console.log(payload);

    return {
      success: false,
      error: 'Cloud Function not configured. Set up sendEmail cloud function in Firebase console.'
    };
  } catch (error) {
    console.error('Failed to send email via Cloud Function:', error);
    return {
      success: false,
      error: String(error)
    };
  }
};

/**
 * Send email via HTTP backend endpoint
 * 
 * Backend must implement POST /api/send-email
 * Request body:
 * {
 *   recipientEmail: string
 *   subject: string
 *   bodyText: string
 *   bodyHtml?: string
 *   senderName?: string
 *   senderEmail?: string
 * }
 */
export const sendEmailViaBackend = async (payload: EmailPayload): Promise<CloudFunctionResponse> => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId
    };
  } catch (error) {
    console.error('Failed to send email via backend:', error);
    return {
      success: false,
      error: String(error)
    };
  }
};

/**
 * High-level email composition for outreach
 */
export const composeColdOutreachEmail = (payload: {
  recipientEmail: string;
  companyName: string;
  contactName: string;
  contactEmail: string; // Sender's business email (required)
  contactPhone?: string;
  permitAddress: string;
  permitCity: string;
  salesPitch: string;
  projectValue: number;
  appliedDate: string;
}): EmailPayload => {
  const {
    recipientEmail,
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    permitAddress,
    permitCity,
    salesPitch,
    projectValue,
    appliedDate
  } = payload;

  const subject = `${companyName} - Permit Opportunity at ${permitAddress}`;

  const bodyText = `
Hello,

${salesPitch}

Project: ${permitAddress}, ${permitCity}
Value: $${projectValue.toLocaleString()}
Applied: ${appliedDate}

Best regards,
${contactName}
${companyName}
${contactPhone ? `Phone: ${contactPhone}` : ''}
  `.trim();

  const bodyHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Hello,</p>
        <p>${salesPitch}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p>
          <strong>Project:</strong> ${permitAddress}, ${permitCity}<br/>
          <strong>Value:</strong> $${projectValue.toLocaleString()}<br/>
          <strong>Applied:</strong> ${appliedDate}
        </p>
        <p>
          Best regards,<br/>
          <strong>${contactName}</strong><br/>
          ${companyName}<br/>
          ${contactPhone ? `<a href="tel:${contactPhone}">${contactPhone}</a>` : ''}
        </p>
      </body>
    </html>
  `;

  return {
    recipientEmail,
    subject,
    bodyText,
    bodyHtml,
    senderName: contactName,
    senderEmail: contactEmail // Business email address
  };
};

/**
 * Fallback: Generate mailto link if Firebase/backend unavailable
 */
export const generateMailtoFallback = (payload: EmailPayload): string => {
  const subject = encodeURIComponent(payload.subject);
  const body = encodeURIComponent(payload.bodyText);
  return `mailto:${payload.recipientEmail}?subject=${subject}&body=${body}`;
};
