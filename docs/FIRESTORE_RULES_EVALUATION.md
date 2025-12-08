# Firestore Security Rules Evaluation

## Current Status: ⚠️ NEEDS ATTENTION

Based on the error you're seeing (`Failed to get document because the client is offline`), your Firestore rules are likely **either missing, blocking all access, or not properly set**.

---

## What Should Be There

### ✅ **Recommended Rules for FinishOutNow:**

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to claim leads
    match /claimed_leads/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Allow authenticated users to track lead visibility
    match /lead_visibility/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Block everything else (security best practice)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Why These Rules?

| Rule | Purpose | Security |
|------|---------|----------|
| `claimed_leads` read/write | Let users claim and view lead claims | ✅ Only if authenticated |
| `lead_visibility` read/write | Cache lead status across sessions | ✅ Only if authenticated |
| Default deny | Block any other collection access | ✅ High security |

---

## How to Verify Current Rules

1. **Open Firebase Console:**
   ```
   https://console.firebase.google.com/project/finishoutnow-tx/firestore/rules
   ```

2. **Check if:**
   - Rules tab shows actual rules (not empty)
   - Status says "✅ Published"
   - Deployment date is recent

3. **If empty or says "Rules not yet published":**
   - ❌ That's your problem
   - Your rules are at default (deny all)
   - Lead claiming will fail

---

## Evaluation Checklist

### **Check These in Firebase Console:**

- [ ] Firestore → Rules tab opens without error
- [ ] Rules are NOT empty
- [ ] Rules mention `claimed_leads` collection
- [ ] Rules mention `request.auth != null` (authentication check)
- [ ] Status shows "✅ Published" (green checkmark)
- [ ] Last deployed date is recent (not months old)

### **If Any Are ❌:**

Go to **Firestore Rules Tab** and paste the rules from above, then click **Publish**.

---

## Production Security Considerations

### **Current Rules Are Good For:**
✅ Development/MVP phase
✅ Single-tenant (all users access same data)
✅ Rapid prototyping with authentication

### **For Production, Consider Adding:**

```firestore
// More restrictive: Users can only read/write their own claims
match /claimed_leads/{claimId} {
  allow read, write: if request.auth != null && 
                       request.resource.data.businessId == request.auth.uid;
}
```

This ensures users can't see other companies' claims (important for multi-tenant).

---

## Quick Diagnostic

**Run this in browser console:**

```javascript
// Check if Firestore is initialized
if (window.db) {
  console.log('✅ Firestore initialized');
} else {
  console.log('❌ Firestore NOT initialized');
}

// Try a test read
import { collection, getDocs } from 'firebase/firestore';
getDocs(collection(window.db, 'claimed_leads')).then(() => {
  console.log('✅ Firestore accessible');
}).catch(err => {
  console.log('❌ Firestore error:', err.message);
});
```

---

## Next Steps

### **Immediate Action:**

1. **Go to:** https://console.firebase.google.com/project/finishoutnow-tx/firestore/rules
2. **Copy/paste recommended rules** from above
3. **Click "Publish"**
4. **Refresh app** - error should disappear

### **After Rules Are Published:**

- ✅ Lead claiming works with Firestore sync
- ✅ No more "offline" errors
- ✅ Multiple users see same lead state
- ✅ Claims persist across sessions/browsers

---

## Troubleshooting

### **Error: "Missing or insufficient permissions"**
**Cause:** Rules are in place but user isn't authenticated
**Solution:** Ensure demo login is working (check console for auth messages)

### **Error: "Failed to get document because client is offline"**
**Cause:** Rules are missing or not published
**Solution:** Publish rules from above

### **Error: "Invalid API Key"**
**Cause:** Firebase credentials are wrong in `.env.local`
**Solution:** Check `.env.local` has correct values from Firebase Console

### **Rules published but still getting errors?**
**Solution:** 
1. Hard refresh browser (Ctrl+F5)
2. Check that `.env.local` has `VITE_FIREBASE_PROJECT_ID=finishoutnow-tx`
3. Verify in console: `[Firebase] ✅ Firestore initialized for project: finishoutnow-tx`

---

## Summary

**Current Problem:** Firestore rules likely not set → all access blocked

**Fix:** Publish the recommended rules above in Firebase Console

**Result:** Lead claiming works perfectly ✅

---

**Do this NOW and the error will disappear!** ⏱️
