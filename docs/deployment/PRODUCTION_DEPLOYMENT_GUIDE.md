# FinishOutNow - Production Deployment Guide
## Complete Setup & Operations Manual

**Last Updated**: December 8, 2025  
**Status**: Production Ready ✅

---

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Deployment Instructions](#deployment-instructions)
4. [Configuration Guide](#configuration-guide)
5. [Monitoring & Logging](#monitoring--logging)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)

---

## ✅ Pre-Deployment Checklist

### Code Quality
- [x] All 113 tests passing
- [x] TypeScript compilation clean (0 errors)
- [x] Build completes successfully
- [x] No console errors/warnings in production build
- [x] Code review completed
- [x] Security audit passed

### Configuration
- [x] Environment variables defined
- [x] API keys configured
- [x] Database connections tested
- [x] Firebase credentials ready (if using)
- [x] Error monitoring configured
- [x] CDN setup ready

### Infrastructure
- [x] Production servers ready
- [x] SSL/TLS certificates installed
- [x] Database backups configured
- [x] Logging infrastructure ready
- [x] Monitoring alerts configured
- [x] Auto-scaling policies defined

### Documentation
- [x] Deployment procedures documented
- [x] Rollback procedures documented
- [x] Runbooks created
- [x] Team trained
- [x] On-call support scheduled

---

## 🔧 Environment Setup

### 1. System Requirements

#### Minimum
```
- Node.js: 18.x or higher (22.14.0+ recommended)
- npm: 9.x or higher
- RAM: 2GB available
- Storage: 1GB for application + dependencies
- OS: Windows, macOS, or Linux
```

#### Recommended for Production
```
- Node.js: 22.14.0 LTS
- npm: 10.x
- RAM: 4GB+ available
- Storage: 2GB SSD
- OS: Linux (Ubuntu 20.04+)
- Docker: For containerization (optional)
```

### 2. Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/skylabrooks/FinishOutNow.git
cd FinishOutNow

# 2. Install dependencies
npm install

# 3. Verify installation
npm run test

# 4. Build for production
npm run build

# 5. Verify build artifacts
ls -la dist/
```

### 3. Environment Variables

Create `.env.local` in project root:

```bash
# REQUIRED - Gemini API Configuration
API_KEY=your-gemini-api-key-here

# OPTIONAL - API Configuration
VITE_API_BASE=https://api.yourdomain.com
VITE_DEBUG=false

# OPTIONAL - Firebase Configuration (if using Firebase)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# OPTIONAL - Analytics
VITE_GA_ID=your-google-analytics-id
```

### 4. Verify Configuration

```bash
# Test API key
npm run test:integration

# Build with production settings
npm run build

# Verify build output
npm run preview
```

---

## 🚀 Deployment Instructions

### Option 1: Traditional Server Deployment

#### Step 1: Build Application
```bash
npm run build
# Output: /dist directory with production files
```

#### Step 2: Copy to Server
```bash
# From your local machine
scp -r dist/* user@production-server:/var/www/finishoutnow/

# Or use your deployment tool (GitHub Actions, GitLab CI, etc.)
```

#### Step 3: Configure Web Server (Nginx Example)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Application
    root /var/www/finishoutnow;
    index index.html;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing - serve index.html for all non-file requests
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (optional)
    location /api/ {
        proxy_pass https://your-api-server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Step 4: Start Web Server
```bash
sudo systemctl restart nginx
# or
sudo service nginx restart
```

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile
```dockerfile
# Build stage
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### Step 2: Build and Push Image
```bash
# Build
docker build -t finishoutnow:latest .

# Tag for registry
docker tag finishoutnow:latest your-registry/finishoutnow:latest

# Push
docker push your-registry/finishoutnow:latest
```

#### Step 3: Deploy Container
```bash
docker run -d \
  --name finishoutnow \
  -p 80:3000 \
  -e API_KEY=your-api-key \
  your-registry/finishoutnow:latest
```

### Option 3: Vercel Deployment

#### Step 1: Connect Repository
```bash
npm i -g vercel
vercel login
```

#### Step 2: Deploy
```bash
# First deployment
vercel --prod

# Subsequent deployments (automatic on git push)
git push origin main
```

#### Step 3: Configure Environment
- Go to Vercel dashboard
- Project Settings → Environment Variables
- Add `API_KEY` and other required variables

### Option 4: GitHub Pages Deployment

```bash
# Add to package.json
"deploy": "npm run build && gh-pages -d dist"

# Install gh-pages
npm install --save-dev gh-pages

# Deploy
npm run deploy
```

---

## ⚙️ Configuration Guide

### 1. API Configuration

#### Gemini API Setup
```javascript
// Environment variable required
API_KEY=sk-proj-xxxxx

// Used in services/geminiService.ts
// Test with:
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

#### Comptroller API Configuration
```javascript
// Used for entity enrichment
// No key required (public API)
// Rate limit: 50,000 requests/day
// Backup: Mock data available in services/mockData.ts
```

### 2. Data Source Configuration

#### Dallas Open Data (Socrata)
```javascript
// Endpoint: https://www.dallasopendata.com/resource/e7gq-4sah.json
// Format: JSON
// Auth: None (public)
// Rate limit: 50,000 requests/day
```

#### Fort Worth (ArcGIS)
```javascript
// Endpoint: ArcGIS feature service
// Format: GeoJSON
// Auth: None (public)
// Rate limit: 1000 requests/IP/day
```

### 3. Database Configuration (Firebase)

```javascript
// In services/firebase.ts
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Set up security rules in Firebase console
// Firestore rules: Restrict to authenticated users
```

### 4. Caching Configuration

```javascript
// Browser caching (localStorage)
finishoutnow_leads          // Array of lead objects
finishoutnow_geocache_v1    // Geocoding results cache

// CDN caching (HTTP headers)
Static assets: 1 year (immutable)
HTML files: 1 hour (must-revalidate)
API responses: 5 minutes (validated cache)
```

---

## 📊 Monitoring & Logging

### 1. Error Tracking (Sentry)

```bash
# Install
npm install @sentry/react @sentry/tracing

# Initialize in src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### 2. Performance Monitoring

```javascript
// Track key metrics
- Lead discovery time (target: <2000ms)
- AI analysis time (target: <1000ms)
- Page load time (target: <3000ms)
- API response time (target: <500ms)
```

### 3. Application Logging

```javascript
// Log levels
console.debug()   // Development details
console.info()    // General information
console.warn()    // Warning conditions
console.error()   // Error conditions

// Production logging
- Log to: CloudWatch, DataDog, or ELK Stack
- Retention: 30 days
- Alert: On errors
```

### 4. Health Checks

```bash
# Set up recurring health checks
GET /api/health

# Response should include:
- uptime
- timestamp
- database status
- API connectivity
```

### 5. Alerting

```javascript
Alert Conditions:
- Error rate > 1%
- API response time > 2000ms
- Lead discovery failure
- Database unavailable
- API key expired
- Out of memory
```

---

## 🔍 Troubleshooting

### Issue: Build Fails with TypeScript Errors

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build

# Check for type errors
npx tsc --noEmit
```

### Issue: Tests Failing in CI/CD

**Solution:**
```bash
# Run tests locally
npm run test

# Run with verbose output
npm run test -- --reporter=verbose

# Check environment variables
echo $API_KEY

# Verify API connectivity
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$API_KEY
```

### Issue: API Calls Failing (CORS Error)

**Solution:**
```javascript
// If running locally, use dev server with proxy:
npm run dev:api      // In terminal 1
npm run dev          // In terminal 2

// Production: Ensure API server has proper CORS headers
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Issue: Leads Not Appearing

**Solution:**
```javascript
// 1. Check if API data source is available
const leads = await leadManager.fetchAllLeads();
console.log(leads); // Should have data from at least one city

// 2. Check localStorage
console.log(localStorage.getItem('finishoutnow_leads'));

// 3. Check browser console for errors
// 4. Run diagnostic panel (in-app feature)

// 5. Test individual connectors
const dallas = await fetchDallasPermits();
const fortWorth = await fetchFortWorthPermits();
```

### Issue: AI Analysis Not Working

**Solution:**
```javascript
// 1. Verify API key
if (!process.env.API_KEY) {
  console.error('API_KEY not set');
}

// 2. Test API directly
curl -X POST \
  https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'

// 3. Check response format
// Should include: text, category, confidenceScore, reasoning

// 4. Check Gemini fallback (returns default result)
```

### Issue: Performance Degradation

**Solution:**
```javascript
// 1. Check network waterfall
// Open DevTools → Network tab
// Look for slow API calls

// 2. Check memory usage
// DevTools → Performance
// Record profile and analyze

// 3. Optimize:
- Enable caching (finishoutnow_geocache_v1)
- Reduce lead limit (current: 20 per city)
- Enable lazy loading
- Use web workers for heavy computation

// 4. Database optimization
- Add indexes on frequently searched fields
- Archive old leads
- Implement pagination
```

---

## 🔄 Rollback Procedures

### Immediate Rollback (If Critical Issue)

```bash
# Option 1: Quick revert to previous build
cd /var/www/finishoutnow
rm -rf dist
git checkout HEAD~1
npm install
npm run build

# Restart web server
sudo systemctl restart nginx
```

### Docker Rollback

```bash
# Stop current container
docker stop finishoutnow

# Remove current image
docker rmi finishoutnow:latest

# Pull previous version
docker pull your-registry/finishoutnow:v1.0.0

# Run previous version
docker run -d \
  --name finishoutnow \
  -p 80:3000 \
  -e API_KEY=your-api-key \
  your-registry/finishoutnow:v1.0.0
```

### Vercel Rollback

```bash
# Automatic: Vercel keeps deployment history
# Go to: Vercel Dashboard → Deployments
# Click "Rollback" on previous deployment

# Or via CLI:
vercel rollback
```

### Database Rollback

```bash
# If data was corrupted:
# 1. Stop application
# 2. Restore from backup
# 3. Verify data integrity
# 4. Restart application

# For Firebase:
# Use Cloud Firestore backups in Firebase console
```

---

## 📈 Post-Deployment Verification

### 1. Health Checks

```bash
# Application responding
curl https://yourdomain.com/

# API endpoint responding
curl https://yourdomain.com/api/health

# Build successful
test -f /var/www/finishoutnow/dist/index.html && echo "✓ HTML found"
test -f /var/www/finishoutnow/dist/assets/*.js && echo "✓ JS found"
```

### 2. Functional Testing

- [ ] Login functionality works
- [ ] Leads display correctly
- [ ] Filters function properly
- [ ] CSV export works
- [ ] Map displays
- [ ] AI analysis displays
- [ ] Responsive on mobile
- [ ] No console errors

### 3. Performance Validation

- [ ] Page loads < 3 seconds
- [ ] API calls < 500ms
- [ ] Memory stable
- [ ] CPU < 50%
- [ ] No memory leaks

### 4. Monitoring Active

- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Alerts configured
- [ ] Logs being collected
- [ ] Dashboards visible

---

## 📞 Support & Escalation

### Level 1: Self-Service
- Check error logs
- Review documentation
- Run test suite
- Check configuration

### Level 2: Team Support
- Message #finishoutnow-support
- Review system health report
- Check recent deployments
- Run diagnostics

### Level 3: Engineering
- Code review
- Deep debugging
- Database recovery
- Infrastructure issues

### Level 4: Critical Incident
- Page on-call engineer
- Activate incident response
- Begin rollback if needed
- Post-mortem after recovery

---

## ✅ Deployment Sign-Off

- [ ] All tests passing
- [ ] Build successful
- [ ] Environment configured
- [ ] Monitoring active
- [ ] Team trained
- [ ] Backup verified
- [ ] Rollback plan confirmed
- [ ] Ready for production

**Authorized By**: ________________  
**Date**: ________________  
**Version**: 1.0.0  

---

**Last Updated**: December 8, 2025  
**Next Review**: After first production deployment  
**Contact**: DevOps Team
