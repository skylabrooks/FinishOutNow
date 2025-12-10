# Appointment Setting Feature - Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] Set `VITE_GEMINI_API_KEY` in production `.env`
- [ ] Verify Firebase project is configured
- [ ] Test Gemini API connection in production
- [ ] Confirm Firestore is accessible

### Code Verification
- [x] Zero TypeScript errors
- [x] Zero linting errors
- [x] All files properly formatted
- [x] No console errors in development
- [ ] Build succeeds (`npm run build`)
- [ ] Preview works (`npm run preview`)

### Testing Requirements
- [ ] Test email generation with 5+ different leads
- [ ] Test call attempt recording (all 6 outcomes)
- [ ] Test 2-day interval enforcement
- [ ] Test max attempts limit (6)
- [ ] Test appointment scheduling
- [ ] Test status badge updates
- [ ] Test offline mode (localStorage fallback)
- [ ] Test on mobile browser
- [ ] Test with slow network connection
- [ ] Verify no breaking changes to existing claim flow

## Firebase Setup

### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /claimed_leads/{claimId} {
      // Read: Only claim owner
      allow read: if request.auth != null && 
        resource.data.businessId == request.auth.uid;
      
      // Create: Authenticated users
      allow create: if request.auth != null;
      
      // Update: Claim owner or E BookGov rep
      allow update: if request.auth != null && 
        (resource.data.businessId == request.auth.uid || 
         request.auth.token.ebookgovRep == true);
      
      // Delete: Claim owner only
      allow delete: if request.auth != null && 
        resource.data.businessId == request.auth.uid;
    }
  }
}
```

- [ ] Deploy security rules to production
- [ ] Test rules with real authentication
- [ ] Verify non-owners cannot access claims
- [ ] Verify reps can update appointment data

### Indexes
- [ ] Create composite index on `claimed_leads` collection:
  - Fields: `businessId` (Ascending), `appointmentStatus` (Ascending)
  - Query scope: Collection
- [ ] Create index on `claimed_leads`:
  - Fields: `assignedRepId` (Ascending), `appointmentStatus` (Ascending)
  - Query scope: Collection

### Collections
- [ ] Verify `claimed_leads` collection exists
- [ ] Set up backup policy (daily)
- [ ] Configure monitoring alerts

## Documentation

### User Guides
- [x] Technical implementation guide completed
- [x] E BookGov rep quick start guide completed
- [x] Implementation summary created
- [ ] Client FAQ written
- [ ] Video tutorial recorded (optional)

### Training
- [ ] Schedule rep training session
- [ ] Create training account for practice
- [ ] Prepare demo leads for training
- [ ] Document common issues and solutions

## Monitoring & Analytics

### Error Tracking
- [ ] Set up Sentry or similar error tracking
- [ ] Configure alerts for:
  - Email generation failures
  - Firebase write failures
  - API rate limit exceeded
- [ ] Create error dashboard

### Analytics Events
```typescript
// Recommended events to track:
analytics.track('appointment_email_generated', {
  leadId: string,
  leadCategory: string,
  generationTime: number
});

analytics.track('call_attempt_recorded', {
  leadId: string,
  attemptNumber: number,
  outcome: string
});

analytics.track('appointment_scheduled', {
  leadId: string,
  totalAttempts: number,
  daysElapsed: number
});
```

- [ ] Implement analytics tracking
- [ ] Create dashboard for metrics:
  - Email generation success rate
  - Average attempts per appointment
  - Appointment set rate by rep
  - Time to first appointment

## Performance

### Optimization
- [ ] Test email generation speed (target: < 3s)
- [ ] Verify modal loads smoothly (< 1s)
- [ ] Check Firebase query performance
- [ ] Test with 100+ claimed leads

### Caching
- [ ] Verify localStorage caching works
- [ ] Test cache invalidation
- [ ] Confirm offline mode functionality

## Rollout Strategy

### Phase 1: Internal Beta (Week 1)
- [ ] Deploy to staging environment
- [ ] Test with E BookGov team (5 leads)
- [ ] Gather feedback from reps
- [ ] Fix any critical bugs

### Phase 2: Client Beta (Week 2-3)
- [ ] Select 3-5 pilot clients
- [ ] Provide training and onboarding
- [ ] Monitor usage closely
- [ ] Collect feedback
- [ ] Iterate on UX issues

### Phase 3: Full Launch (Week 4)
- [ ] Deploy to production
- [ ] Announce to all clients
- [ ] Send training materials
- [ ] Monitor for 48 hours
- [ ] Address any issues immediately

## Communication Plan

### Internal Announcement
```
Subject: New Feature: Appointment Setting Service

Team,

We've launched a new Appointment Setting Service! Clients can now:
1. Generate AI-powered outreach emails
2. Track our rep's call attempts (up to 6)
3. View scheduled appointments in real-time

Reps: Review the quick start guide at /docs/features/EBOOKGOV_REP_GUIDE.md

Questions? Contact [lead developer]
```

- [ ] Send internal announcement
- [ ] Schedule team demo meeting
- [ ] Update internal documentation

### Client Announcement
```
Subject: Introducing Appointment Setting - Your Personal Sales Team

Hi [Client Name],

Great news! We're now offering professional appointment setting for your acquired leads.

How it works:
1. Acquire a lead (as usual)
2. Generate a personalized email with AI
3. Send it to the prospect
4. Our team makes up to 6 calls over 2 weeks
5. We schedule the appointment for you!

Check it out in your Acquired Leads dashboard.

- The E BookGov Team
```

- [ ] Draft client announcement
- [ ] Create demo video (optional)
- [ ] Send to all active clients
- [ ] Schedule Q&A session

## Post-Launch

### Week 1
- [ ] Monitor error rates daily
- [ ] Review first 10 appointments set
- [ ] Gather rep feedback
- [ ] Document any issues

### Week 2-4
- [ ] Analyze conversion rates
- [ ] Review email template performance
- [ ] Optimize call attempt strategies
- [ ] Plan Phase 2 features

### Ongoing
- [ ] Monthly performance review
- [ ] Quarterly feature enhancements
- [ ] Continuous rep training
- [ ] A/B test email templates

## Success Metrics (30 Days)

### Technical
- [ ] < 1% error rate
- [ ] 95% uptime
- [ ] < 3s email generation
- [ ] < 100ms UI updates

### Business
- [ ] 25% appointment set rate
- [ ] 50+ appointments scheduled
- [ ] 90% client satisfaction
- [ ] 100% rep adoption

### Quality
- [ ] < 5 support tickets
- [ ] No critical bugs
- [ ] No data loss incidents
- [ ] Positive client feedback

## Rollback Plan

### If Critical Issues Arise
1. **Immediate Actions:**
   - [ ] Disable email generation button
   - [ ] Show maintenance message
   - [ ] Notify clients of temporary outage

2. **Investigation:**
   - [ ] Review error logs
   - [ ] Identify root cause
   - [ ] Document issue

3. **Resolution:**
   - [ ] Fix in hotfix branch
   - [ ] Test thoroughly
   - [ ] Deploy patch
   - [ ] Verify fix

4. **Communication:**
   - [ ] Notify affected users
   - [ ] Provide timeline
   - [ ] Send all-clear message

## Support Contacts

### Technical Issues
- Lead Developer: [Name/Email]
- DevOps: [Name/Email]
- Firebase Admin: [Name/Email]

### Business Issues
- Product Manager: [Name/Email]
- Client Success: [Name/Email]
- E BookGov Supervisor: [Name/Email]

## Sign-Off

### Pre-Launch Approval
- [ ] Lead Developer approval
- [ ] Product Manager approval
- [ ] QA team approval
- [ ] E BookGov management approval

### Launch Authorization
- [ ] Final code review completed
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Support team briefed

**Approved By:**
- Developer: _________________ Date: _______
- Product: _________________ Date: _______
- QA: _________________ Date: _______
- Management: _________________ Date: _______

---

## 🚀 Ready for Launch!

Once all items are checked, you're ready to deploy the Appointment Setting feature to production.

**Good luck and happy closing! 🎉**
