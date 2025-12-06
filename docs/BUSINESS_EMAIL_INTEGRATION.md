# Business Email Integration

## Overview

The system now sends emails **from the business owner's email address**, not from a shared system address.

When a business (e.g., "Apex Security Integrators") clicks "Claim & Contact" on a lead, the email is sent from their configured business email address.

## How It Works

### 1. **Company Profile Email**
Each user sets their business email in **Settings Modal**:
- Company Name: "Apex Security Integrators"
- Contact Name: "Mike Ross"
- **Email: "mike@apexdfw.com"** ← This is the sender

### 2. **Email Composition**
When "Claim & Contact" is clicked:
```typescript
composeColdOutreachEmail({
  recipientEmail: 'property-owner@company.com',
  companyName: 'Apex Security Integrators',
  contactName: 'Mike Ross',
  contactEmail: 'mike@apexdfw.com',  // ← Business email (sender)
  contactPhone: '214-555-0199',
  ...
})
```

### 3. **Email Delivery Flow**
```
User clicks "Claim & Contact"
  ↓
Frontend composes email with business email as sender
  ↓
Firebase backend receives payload (includes senderEmail)
  ↓
Backend sends via SendGrid/Mailgun using senderEmail as FROM
  ↓
Property owner receives email FROM "mike@apexdfw.com"
  ↓
They can reply directly to the business owner
```

## Backend Email Service Implementation

When you implement the backend email service (choose one):

### Option A: SendGrid (Recommended)
```javascript
// Node.js Cloud Function
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: payload.recipientEmail,
  from: payload.senderEmail,  // Business email from payload
  fromname: payload.senderName,
  subject: payload.subject,
  text: payload.bodyText,
  html: payload.bodyHtml
};

await sgMail.send(msg);
```

### Option B: Firebase Extensions
1. Install "Trigger Email from Firestore" extension
2. Configure verified sender domain
3. Backend writes to Firestore:
```javascript
await firestore.collection('mail').add({
  to: payload.recipientEmail,
  message: {
    from: payload.senderEmail,
    subject: payload.subject,
    text: payload.bodyText,
    html: payload.bodyHtml
  }
});
```

### Option C: Mailgun
```javascript
const mailgun = require('mailgun-js');
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY });

const data = {
  from: payload.senderEmail,
  to: payload.recipientEmail,
  subject: payload.subject,
  text: payload.bodyText,
  html: payload.bodyHtml
};

await mg.messages().send(data);
```

## User Workflow

1. **User opens Settings** → Enters their business email
2. **User finds a permit** → Clicks "Claim & Contact"
3. **Email sent from their address** → "From: mike@apexdfw.com"
4. **Lead receives email** → Can reply to business directly
5. **No middleman** → Direct B2B communication

## Email Payload Structure

```typescript
{
  recipientEmail: 'property-owner@company.com',      // To: line
  subject: 'Apex Security - Permit at 101 W Abram',  // Subject
  bodyText: 'Plain text version',                    // Text body
  bodyHtml: '<html>...</html>',                       // HTML body
  senderName: 'Mike Ross',                           // Display name
  senderEmail: 'mike@apexdfw.com',                   // FROM address
  replyTo: 'mike@apexdfw.com'                        // Reply-To
}
```

## Error Handling

If Firebase email delivery fails:
1. Falls back to `mailto:` link
2. User can manually send from their email client
3. Pitch is copied to clipboard for convenience

## Security Notes

- 🔒 Sender email comes from company profile (user-configured)
- 🔐 Backend validates all email addresses
- 🛡️ SPF/DKIM setup required for deliverability (see email provider)
- ✅ No credentials shared with frontend

## Next Steps

1. **Verify company email in settings** ✅ (Already in UI)
2. **Deploy backend email handler** → Choose SendGrid/Firebase/Mailgun
3. **Add verified sender domain** → Email provider setup
4. **Test end-to-end** → Click Claim & Contact, verify FROM address
5. **Monitor delivery** → Check email provider logs

## Example Email

```
FROM: Mike Ross <mike@apexdfw.com>
TO: john@propertycompany.com
SUBJECT: Apex Security - Permit Opportunity at 101 W Abram St, Arlington, TX

Body:
Hello,

Hi John, Mike Ross here from Apex Security Integrators. 
I saw your permit for the "Rangers Republic" interior remodel in Arlington, TX, 
specifically the demising wall changes. We specialize in rapid access control 
deployment for high-security commercial tenants...

Project: 101 W Abram St, Arlington, TX
Value: $150,000
Applied: 2025-12-05

Best regards,
Mike Ross
Apex Security Integrators
214-555-0199
```

The property owner sees this comes directly from Mike at Apex Security and can call/reply directly.
