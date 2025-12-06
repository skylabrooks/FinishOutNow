# Firebase Integration Guide

## Overview

FinishOutNow now uses **Firebase** for:
- 🔐 User Authentication (Email/Password)
- 📧 Email Delivery via Cloud Messaging
- 📱 Push Notifications (optional)

## Setup Steps

### 1. Firebase Project Configuration

Your Firebase project `finishoutnow-tx` is already created with:
- **Project ID**: `finishoutnow-tx`
- **Sender ID**: `533689252250`
- **Firebase Console**: https://console.firebase.google.com/project/finishoutnow-tx

### 2. Environment Variables

Update `.env.local` with your Firebase config (already pre-filled):

```env
VITE_FIREBASE_API_KEY=AIzaSyAUeQIDkmMV8lQHNqVhYF9oYFlGghxchpQ
VITE_FIREBASE_AUTH_DOMAIN=finishoutnow-tx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=finishoutnow-tx
VITE_FIREBASE_STORAGE_BUCKET=finishoutnow-tx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=533689252250
VITE_FIREBASE_APP_ID=1:533689252250:web:773e72b5183ee1b6bb6223
VITE_FIREBASE_MEASUREMENT_ID=G-G1B4THDHQF
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE  # See Cloud Messaging setup below
```

### 3. Enable Authentication

In Firebase Console:

1. **Build → Authentication → Sign-in method**
2. Enable **Email/Password** provider
3. Users can now register and sign in

### 4. Email Delivery Setup (Choose One)

#### Option A: Firebase Extensions (Recommended)

**Easiest approach:**

1. Go to **Build → Extensions**
2. Search for **"Trigger Email from Firestore"**
3. Install the extension
4. Configure sender email (e.g., `noreply@finishoutnow.app`)
5. Extension automatically sends emails from `mail` collection writes

**Usage in code** (already implemented in `firebaseEmail.ts`):
```typescript
// App sends email via Cloud Function or HTTP API
// Backend writes to Firestore 'mail' collection
// Firebase Extension triggers and sends email
```

#### Option B: Cloud Functions + SendGrid

**For custom email logic:**

1. Install SendGrid: `npm install @sendgrid/mail`
2. Set environment variables in Firebase:
   ```
   SENDGRID_API_KEY=<your-sendgrid-key>
   SENDER_EMAIL=noreply@finishoutnow.app
   ```
3. Deploy Cloud Function: See `/api/send-email.ts` for implementation

#### Option C: Cloud Messaging (Push Notifications)

**For browser push notifications:**

1. Go to **Project Settings → Cloud Messaging**
2. Copy **Server API Key** (also called **Legacy Server Key**)
3. Generate **VAPID Key**:
   - In Firebase Console: **Project Settings → Cloud Messaging → Web Push certificates**
   - Click "Generate Key Pair"
   - Copy to `.env.local` as `VITE_FIREBASE_VAPID_KEY`

4. Users must grant notification permission when prompted

### 5. Install Firebase SDK

Already added to `package.json`:
```bash
npm install firebase
```

Then run:
```bash
npm install
```

### 6. Test Authentication

1. Start the dev server: `npm run dev:full`
2. Open app at http://localhost:3000
3. Look for **Sign In / Register** button (if added to UI)
4. Test email/password sign-up and login

### 7. Test Email Delivery

1. Open a permit and click **"Claim & Contact"**
2. App will attempt Firebase email delivery
3. Falls back to `mailto:` link if Firebase not configured
4. Check backend logs for delivery status

## File Structure

```
services/
├── firebase.ts              # Firebase init & auth helpers
├── firebaseEmail.ts         # Email composition & delivery
└── AuthContext.tsx          # React auth provider

components/
└── AnalysisModal.tsx        # Uses Firebase email for Claim & Contact

api/
└── send-email.ts            # Vercel serverless endpoint for email

.env.local                   # Firebase config (environment variables)
```

## Code Examples

### Sign In a User

```typescript
import { useAuth } from './services/AuthContext';

function LoginForm() {
  const { login } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await login(email, password);
      console.log('Logged in:', user.email);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
}
```

### Check Current User

```typescript
import { useAuth } from './services/AuthContext';

function UserProfile() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;
  
  return <div>Welcome, {user.email}</div>;
}
```

### Send Email

```typescript
import { composeColdOutreachEmail, sendEmailViaBackend } from './services/firebaseEmail';

const emailPayload = composeColdOutreachEmail({
  recipientEmail: 'customer@company.com',
  companyName: 'Apex Security',
  contactName: 'Mike Ross',
  permitAddress: '101 W Abram St, Arlington, TX',
  permitCity: 'Arlington',
  salesPitch: 'We specialize in rapid access control...',
  projectValue: 150000,
  appliedDate: '2025-12-05'
});

const result = await sendEmailViaBackend(emailPayload);
if (result.success) {
  console.log('Email sent:', result.messageId);
}
```

## Troubleshooting

### "Firebase initialization failed"
- Check `.env.local` has all required variables
- Restart dev server after updating `.env.local`

### Emails not sending
1. Verify Firebase Extensions or Cloud Function is deployed
2. Check Firebase Console → Functions → Logs
3. Verify SENDGRID_API_KEY if using SendGrid
4. Fallback to `mailto:` link will work (browser default)

### Notifications not working
- User must grant permission when prompted
- VAPID key must be set in `.env.local`
- Browser must support Notification API

### Auth not persisting
- Check browser localStorage is enabled
- Verify auth persistence is configured in `firebase.ts`

## Production Deployment (Vercel)

1. Add environment variables in Vercel project settings:
   ```
   VITE_FIREBASE_*   (all the same values from .env.local)
   SENDGRID_API_KEY  (if using SendGrid)
   SENDER_EMAIL      (if using SendGrid)
   ```

2. Redeploy app: `vercel deploy`

3. Verify auth works in production at: https://finishoutnow-tx.vercel.app

## Security Notes

- 🔒 API keys are intentionally public (marked `VITE_*` prefix)
- 🔐 Sensitive data (SENDGRID_API_KEY) goes in Vercel environment only
- 🚫 Never commit `.env.local` to Git (already in `.gitignore`)
- 🛡️ Firebase Security Rules handle authorization on backend

## Next Steps

- [ ] Set up Firebase Extensions for email delivery
- [ ] Add Sign In/Register UI components
- [ ] Deploy to Vercel with environment variables
- [ ] Test end-to-end email workflow
- [ ] Add two-factor authentication (optional)
- [ ] Implement user profile management

## References

- Firebase Console: https://console.firebase.google.com/project/finishoutnow-tx
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Extensions: https://firebase.google.com/extensions
- SendGrid Integration: https://sendgrid.com/
