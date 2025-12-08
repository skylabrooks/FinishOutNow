# 🔴 URGENT: Fix Firebase Firestore Rules NOW

## The Problem
Your app says: "Failed to get document because the client is offline"

**Real cause:** Firestore Security Rules are blocking access, not network being down.

---

## The Fix (2 Minutes)

### **Step 1:** Open Firebase Console
```
https://console.firebase.google.com/project/finishoutnow-tx/firestore/rules
```

### **Step 2:** Paste These Rules
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /claimed_leads/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /lead_visibility/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### **Step 3:** Click "Publish" (Blue Button)

### **Step 4:** Wait for ✅ "Rules deployed" (30 seconds)

### **Step 5:** Refresh Your App

**Done!** Lead claiming should now work. 🎉

---

## Why?

- ❌ **Before:** No rules = Firestore blocks ALL access
- ✅ **After:** Rules allow authenticated users to read/write leads

---

## Still Not Working?

Check:
1. ✅ Rules actually published (refresh Firebase Console to verify)
2. ✅ `.env.local` has Firebase credentials (projectId, apiKey, etc.)
3. ✅ App refreshed after publishing rules
4. ✅ Check browser console for error message (screenshot it)

If still failing → See `FIREBASE_SETUP_FIRESTORE_RULES.md` for full troubleshooting guide.

---

**Do this NOW before testing lead claims!** ⏱️
