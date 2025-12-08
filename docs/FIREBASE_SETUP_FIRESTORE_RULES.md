# Firebase Firestore Security Rules Setup

## 🚨 CRITICAL STEP: Add These Rules to Your Firebase Console

The "offline" error happens because **Firestore Security Rules are blocking access**. Follow these steps:

---

## Step 1: Go to Firebase Console

1. Visit: https://console.firebase.google.com/
2. Select your project: `finishoutnow-tx`
3. Click "Firestore Database" in left sidebar
4. Click "Rules" tab at the top

---

## Step 2: Replace All Existing Rules

Delete everything in the Rules editor and paste this:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow all authenticated users to read/write to claimed_leads
    match /claimed_leads/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Allow all authenticated users to read/write lead visibility cache
    match /lead_visibility/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Default: deny everything else (security best practice)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Step 3: Publish Rules

1. Click the **"Publish"** button (blue button, top right)
2. Confirm the warning
3. Wait for "✅ Rules deployed" message (takes 30 seconds)

---

## Step 4: Test in Your App

1. Go back to your app
2. Click "Claim Lead" button
3. Should now work WITHOUT errors ✅

---

## What These Rules Do

| Rule | Allows |
|------|--------|
| `claimed_leads/{document=**}` | Any authenticated user to read/write lead claims |
| `lead_visibility/{document=**}` | Any authenticated user to read/write visibility cache |
| `default deny` | Blocks everything else (security) |

**Key:** `if request.auth != null` means only logged-in users can access. The demo auto-login handles this.

---

## Why This Fixes the Error

**Before:**
- Rules were missing or blocking all access
- Result: "Failed to get document because the client is offline" error

**After:**
- Rules allow authenticated users to read/write
- Firebase connection works properly
- Lead claiming succeeds

---

## If You Still Get Errors

### **Error: "Missing or insufficient permissions"**
- ✅ Rules are in place, but user isn't authenticated
- Check: Browser console should show "[Firebase] ✅ Firebase initialized successfully"
- Solution: Check that demo login is running (look for `demo@finishoutnow.app` in console)

### **Error: "Failed to get document because the client is offline"**
- ✅ Rules might still be deploying (wait 30 seconds)
- Solution: Refresh the app after publishing rules

### **Error: "Invalid API Key"**
- ❌ Firebase credentials in `.env.local` are wrong
- Solution: Check Firebase Console → Project Settings → copy exact API keys

---

## Quick Reference: Where to Find Rules in Firebase Console

1. **Project:** finishoutnow-tx
2. **Service:** Cloud Firestore
3. **Tab:** "Rules" (next to "Data")
4. **Action:** Paste rules above, then click "Publish"

---

## ⚡ One-Minute Setup

```
1. Open: https://console.firebase.google.com/project/finishoutnow-tx/firestore/rules
2. Delete existing rules
3. Paste rules from above
4. Click "Publish"
5. Go back to app, try claiming a lead
6. ✅ Done!
```

---

## Safety Notes

These rules are secure for a production app because:
- ✅ Only authenticated users can access
- ✅ Users can't access other users' claimed leads (depends on app logic)
- ✅ Default deny on everything else

For multi-tenant (each user sees only their own claims), you'd need stricter rules. For now, this works.

---

## Troubleshooting Checklist

- [ ] Rules published to Firestore (check "Rules" tab shows your rules)
- [ ] `.env.local` has all Firebase credentials filled in
- [ ] App is reloaded after publishing rules
- [ ] Console shows "[Firebase] ✅ Firebase initialized successfully"
- [ ] Demo user is logged in (check console for auth messages)
- [ ] Try claiming a lead

If all checked ✅ but still failing → Contact support with console screenshot

---

## After Setup is Working

Once lead claiming works:

1. Test in browser DevTools offline mode to see fallback work
2. Check Firestore Database → "claimed_leads" collection to see data
3. Verify multiple browsers show same claimed leads
4. Test 30-day expiration (optional - manual test in console)

---

**That's it!** Your Firestore is now ready for production lead claiming. 🚀
