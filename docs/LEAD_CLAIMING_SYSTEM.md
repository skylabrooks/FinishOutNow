# Lead Claiming System - Technical Documentation

**Feature Status:** ✅ Fully Implemented  
**Date:** December 6, 2025  
**Firebase Integration:** Firestore + Authentication

---

## Overview

The Lead Claiming System prevents businesses from bypassing the platform by hiding critical lead details (applicant name, address, valuation) until a lead is formally claimed. This ensures monetization through the claim workflow.

---

## Architecture

### **Frontend Components**

#### **1. PermitCardWithVisibility.tsx**
- Fetches lead visibility status from Firestore
- Conditionally renders fields based on claim status
- Shows "LOCKED" badge for unclaimed leads
- Displays "Claim Lead" button or full details

**Hidden Until Claimed:**
- Applicant Name → "Name hidden"
- Address → "Address hidden until claimed"
- Valuation → "Value hidden"

**Always Visible:**
- Permit Type
- City
- Applied Date
- Status
- Description

#### **2. LeadClaimModal.tsx**
- Confirmation dialog for claiming leads
- Shows permit preview (type, city, estimated value)
- Validates user permissions via `canClaimLead()`
- Calls `claimLead()` to create Firestore record
- Success feedback with auto-close

#### **3. LeadCard.tsx** (Optional Alternative View)
- Compact card view with lock/unlock state
- Similar visibility logic to PermitCardWithVisibility
- Used in alternative layouts (not currently active)

---

### **Backend Services**

#### **firebaseLeads.ts**

**Core Functions:**

```typescript
claimLead(leadId, businessId, businessName, userEmail, paymentStatus)
```
- Creates claim record in Firestore `claimed_leads` collection
- Prevents duplicate claims
- Sets 30-day expiration
- Updates localStorage cache for instant UI feedback

```typescript
getLeadVisibility(leadId)
```
- Checks if lead is claimed (Firestore query)
- Returns visibility object with hidden/visible fields
- Uses localStorage cache (`lead_visibility_cache_v1`) for performance

```typescript
canClaimLead(userEmail, businessId)
```
- Validates user permissions
- Currently allows all authenticated users (demo mode)
- Production: should check subscription status, credit balance, claim limits

```typescript
getBusinessClaims(businessId)
```
- Retrieves all claims for a specific business
- Used for analytics and claim history

---

## Data Models

### **LeadClaim** (Firestore Document)
```typescript
{
  id: string;                    // Composite: businessId_leadId
  leadId: string;                // Permit ID
  businessId: string;            // User/business identifier
  businessName: string;          // Display name
  claimedAt: string;             // ISO timestamp
  claimedBy: string;             // User email
  paymentStatus: 'pending' | 'paid' | 'free';
  expiresAt?: string;            // 30 days from claim
  notes?: string;
}
```

### **LeadVisibility** (Computed Object)
```typescript
{
  leadId: string;
  isClaimed: boolean;
  claimedBy?: string;            // Business name
  hiddenFields: ('applicant' | 'address' | 'valuation' | 'description')[];
  visibleFields: ('permitType' | 'city' | 'status' | 'appliedDate' | ...)[];
}
```

---

## User Flow

### **Unclaimed Lead View**
1. User sees permit card with limited info
2. "LOCKED" badge displayed in top-right
3. Fields show:
   - ✅ Permit type, city, date, status
   - ❌ Applicant name (hidden)
   - ❌ Address (hidden)
   - ❌ Contract value (hidden)
4. "🔐 Claim Lead" button visible

### **Claim Workflow**
1. User clicks "Claim Lead" button
2. `LeadClaimModal` opens with preview
3. User confirms claim
4. System validates permissions (`canClaimLead()`)
5. Firestore record created
6. Success message → modal closes
7. Card instantly updates with full details

### **Claimed Lead View**
1. All fields now visible
2. "LOCKED" badge removed
3. "Claimed by [Business Name]" badge shown
4. "Run AI Analysis" button enabled
5. Full contact workflow available

---

## Firebase Configuration

### **Firestore Collection: `claimed_leads`**

**Document ID Format:** `{businessId}_{leadId}`

**Indexes Required:**
- `leadId` (for visibility checks)
- `businessId` (for business claim history)

**Security Rules (Production):**
```javascript
match /claimed_leads/{claimId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
                   request.resource.data.businessId == request.auth.uid &&
                   !exists(/databases/$(database)/documents/claimed_leads/$(claimId));
  allow update, delete: if false; // Claims are immutable
}
```

### **Cache Strategy**

**localStorage Key:** `lead_visibility_cache_v1`

**Cache Format:**
```json
{
  "DAL-123456": {
    "leadId": "DAL-123456",
    "isClaimed": true,
    "claimedBy": "Apex Security Integrators",
    "hiddenFields": [],
    "visibleFields": ["all"]
  }
}
```

**Cache Invalidation:**
- Manual: `clearVisibilityCache()`
- On claim: Immediately updated
- Lifetime: Persists until browser clear

---

## Integration Points

### **App.tsx Integration**

```typescript
// State
const [showClaimModal, setShowClaimModal] = useState(false);
const [selectedLeadForClaim, setSelectedLeadForClaim] = useState<EnrichedPermit | null>(null);

// Handler
const handleClaimLead = (permit: EnrichedPermit) => {
  setSelectedLeadForClaim(permit);
  setShowClaimModal(true);
};

// Callback after claim
const handleLeadClaimed = async () => {
  setPermits(permits.map(p => p.id === selectedLeadForClaim?.id ? selectedLeadForClaim : p));
};

// Modal render
{showClaimModal && selectedLeadForClaim && (
  <LeadClaimModal
    permit={selectedLeadForClaim}
    businessName={companyProfile.name}
    userEmail="user@example.com"
    businessId="demo-business"
    onClaimed={handleLeadClaimed}
    onClose={() => setShowClaimModal(false)}
  />
)}
```

### **Replace Inline Permit Cards**

**Before:**
```tsx
<div className="permit-card">
  <p>{permit.applicant}</p>
  <p>{permit.address}</p>
</div>
```

**After:**
```tsx
<PermitCardWithVisibility
  permit={permit}
  onSelectPermit={() => setSelectedPermit(permit)}
  onClaimLead={() => handleClaimLead(permit)}
  onAnalyze={() => handleAnalyze(permit.id)}
  isAnalyzing={loadingIds.has(permit.id)}
/>
```

---

## Production Deployment Checklist

### **1. Firebase Setup**
- [ ] Create Firestore database
- [ ] Set up `claimed_leads` collection
- [ ] Add security rules
- [ ] Create composite index: `leadId` + `businessId`

### **2. Authentication Integration**
- [ ] Replace demo `businessId` with `auth.currentUser.uid`
- [ ] Replace `user@example.com` with `auth.currentUser.email`
- [ ] Implement real authentication UI (login/register)

### **3. Payment Integration**
- [ ] Update `canClaimLead()` to check subscription status
- [ ] Add payment gateway (Stripe/PayPal)
- [ ] Implement credit system or monthly claim limits
- [ ] Change `paymentStatus: 'free'` to `'pending'` or `'paid'`

### **4. Business Logic**
- [ ] Set claim expiration policy (currently 30 days)
- [ ] Implement claim transfer/release functionality
- [ ] Add claim analytics dashboard for admins
- [ ] Create claim history view for businesses

### **5. Testing**
- [ ] Test duplicate claim prevention
- [ ] Verify visibility immediately updates after claim
- [ ] Test cache invalidation scenarios
- [ ] Load test Firestore queries with 1000+ leads

---

## Known Limitations

1. **Demo Mode:** All users can claim leads without payment check
2. **No Re-Claim:** Once claimed, leads cannot be transferred or released
3. **Cache Sync:** localStorage cache doesn't sync across devices/browsers
4. **No Claim Analytics:** Admin dashboard not yet implemented
5. **Expiration Enforcement:** 30-day expiration set but not automatically enforced

---

## Future Enhancements

### **Short-term (Next 2 Weeks)**
- Add claim history view for businesses
- Implement subscription tiers (Basic/Pro/Enterprise)
- Add admin dashboard for claim analytics

### **Medium-term (Next Month)**
- Real-time claim notifications (Firebase Cloud Messaging)
- Claim transfer functionality
- Bulk claim purchasing
- Mobile-responsive claim flow

### **Long-term (Next Quarter)**
- AI-powered lead scoring before claim
- Lead recommendation engine
- Claim marketplace (lead reselling)
- Integration with CRM systems (Salesforce, HubSpot)

---

## Troubleshooting

### **"Lead already claimed" Error**
- **Cause:** Duplicate claim attempt
- **Fix:** Check Firestore for existing claim with same `businessId_leadId`
- **Prevention:** Frontend should hide "Claim Lead" button for claimed leads

### **Details Still Hidden After Claim**
- **Cause:** Cache not updated or Firestore write not completed
- **Fix:** Call `clearVisibilityCache()` and refresh
- **Prevention:** Ensure `claimLead()` updates cache before returning

### **Permission Denied Firestore Error**
- **Cause:** Security rules rejecting write
- **Fix:** Verify `request.auth.uid` matches `businessId` in claim data
- **Prevention:** Add proper authentication checks in `canClaimLead()`

---

## Support

**Questions?** Check these resources:
- Firebase docs: https://firebase.google.com/docs/firestore
- Firestore security rules: https://firebase.google.com/docs/rules
- React context patterns: https://react.dev/learn/passing-data-deeply-with-context

**Need help?** Contact:
- Email: support@finishoutnow.com
- Docs: `/docs` folder in project root
