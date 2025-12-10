# API Setup Guide

This document explains how to configure external API credentials for Dallas and Fort Worth permit data.

## Dallas Open Data API

### Getting Your Credentials

1. **Sign up** at [dallasopendata.com](https://www.dallasopendata.com)
2. Navigate to **Developer Settings** (click your avatar → Developer Settings)
3. Create a **New API Key**:
   - Give it a name (e.g., "FinishOutNow")
   - Copy both the **API Key ID** and **Secret** (you won't see the secret again)

### Configuration

Add your credentials to `.env.local`:

```bash
VITE_DALLAS_API_KEY_ID=your_key_id_here
VITE_DALLAS_API_KEY_SECRET=your_secret_here
```

**Current credentials (already configured):**
- API Key ID: `4y0va5g100ot9qs26idtajy0n`
- Secret: `39ltflpajtuhr3t1n93kyz2wjze950x82y06vlpnm2oanoyvg9`

### Rate Limits
- **Without token**: ~100 requests/hour (shared pool)
- **With API key**: ~1,000 requests/hour
- **Need more?** Contact Socrata support for higher limits

### API Endpoint
- **Dataset**: Building & Trade Permits
- **Endpoint**: `https://www.dallasopendata.com/resource/e7gq-4sah.json`
- **Documentation**: Available via the "API" button on the dataset page

---

## Fort Worth Open Data API

### API Source

Fort Worth publishes permits via ArcGIS FeatureServer (not Socrata):
- **Endpoint**: `https://services5.arcgis.com/3ddLCBXe1bRt7mzj/arcgis/rest/services/CFW_Open_Data_Development_Permits_View/FeatureServer/0/query`
- **GeoJSON format**: Append `&f=geojson` to the URL
- **REST JSON format**: Use `&f=json` (default)

### Example Query

```bash
curl "https://services5.arcgis.com/3ddLCBXe1bRt7mzj/arcgis/rest/services/CFW_Open_Data_Development_Permits_View/FeatureServer/0/query?outFields=*&where=1%3D1&resultRecordCount=10&f=json"
```

### Credentials

**No authentication required** — Fort Worth's ArcGIS FeatureServer is publicly accessible.

### Rate Limits

- Check ArcGIS service docs for rate limits (typically ~1,000 requests/hour for public services)
- Respects standard Esri rate limiting

### Key Fields

Common fields returned by the service:
- `Unique_ID` — Unique record identifier
- `Permit_No` — Permit number
- `Permit_Type` — Type of permit (e.g., Commercial, Residential, CO)
- `Full_Street_Address` — Complete address
- `Zip_Code` — ZIP code
- `B1_WORK_DESC` — Work description
- See the FeatureServer metadata for full field list

---

## Fort Worth Open Data API (Previous - Socrata)

**Note**: We switched from the Socrata dataset (`qy5k-jz7m`) to the ArcGIS FeatureServer above because it has more current data and better field coverage. The old Socrata endpoint is still available but deprecated in this app.

---

## How Authentication Works

### Backend Proxy (Recommended)
The app uses backend proxy endpoints that:
1. Add authentication headers automatically
2. Cache results for 5 minutes
3. Handle CORS issues
4. Provide consistent error handling

**Proxy endpoints:**
- Dallas: `/api/permits-dallas`
- Fort Worth: `/api/permits-fortworth`

### Frontend Direct Fallback
If the proxy is unavailable, the frontend falls back to direct API calls with authentication headers if credentials are available.

### Header Format
Socrata APIs use the `X-App-Token` header:

```typescript
headers: {
  'X-App-Token': 'your_key_or_token',
  'Accept': 'application/json'
}
```

---

## Testing Your Setup

### 1. Check Environment Variables
```bash
# In PowerShell
cat .env.local
```

Look for `VITE_DALLAS_API_KEY_ID` and optionally `VITE_FORTWORTH_APP_TOKEN`.

### 2. Test API Directly
```bash
# Dallas (with authentication)
curl -H "X-App-Token: 4y0va5g100ot9qs26idtajy0n" \
  "https://www.dallasopendata.com/resource/e7gq-4sah.json?$limit=5"

# Fort Worth (add token when available)
curl -H "X-App-Token: your_token" \
  "https://data.fortworthtexas.gov/resource/qy5k-jz7m.json?$limit=5"
```

### 3. Run the App
```bash
npm run dev
```

Open the dashboard and check the browser console for:
- `[Dallas] Fetched X permits via proxy`
- `[Fort Worth] Fetched X permits via proxy`

### 4. Run Tests
```bash
npm test
```

If the proxy is running, API tests should pass. Otherwise, direct fallback will be attempted.

---

## Troubleshooting

### "Proxy unavailable, trying direct API..."
- The backend proxy (`/api/permits-*`) isn't running
- Solution: Start the dev server with `npm run dev` or deploy the backend

### CORS Errors
- Direct API calls from the browser are blocked
- Solution: Use the backend proxy (always runs server-side)

### 403 Forbidden or Rate Limit Errors
- No authentication token provided, or token is invalid
- Solution: Verify credentials in `.env.local` and check token validity

### 500 Internal Server Error
- Backend proxy error (check server logs)
- Possible causes: Invalid credentials, API down, network issue

---

## Production Deployment

### Environment Variables
Ensure these are set in your production environment (Vercel, Netlify, etc.):

```bash
VITE_DALLAS_API_KEY_ID=4y0va5g100ot9qs26idtajy0n
VITE_DALLAS_API_KEY_SECRET=39ltflpajtuhr3t1n93kyz2wjze950x82y06vlpnm2oanoyvg9
VITE_FORTWORTH_APP_TOKEN=your_token_here
```

For Vercel, create encrypted environment variables with these names (or use `vercel env add`) and wire them in `vercel.json` secrets:

```bash
vercel env add VITE_DALLAS_API_KEY_ID @vite_dallas_api_key_id
vercel env add VITE_DALLAS_API_KEY_SECRET @vite_dallas_api_key_secret
vercel env add VITE_FORTWORTH_APP_TOKEN @vite_fortworth_app_token
```

Make sure the Fort Worth token is the real app token from your Socrata account; without it the proxy will fall back to anonymous rate limits and can 403.

### Serverless Functions
The proxy endpoints (`api/*.ts`) deploy as serverless functions on Vercel. They:
- Run server-side (no CORS issues)
- Use environment variables automatically
- Cache responses in memory (ephemeral)

### Monitoring
Watch for:
- API rate limit warnings in logs
- Increased latency (check cache hit rates)
- 403/401 errors (authentication issues)

---

## Additional Resources

- [Socrata API Documentation](https://dev.socrata.com/)
- [SoQL Query Language](https://dev.socrata.com/docs/queries/)
- [Dallas Open Data Portal](https://www.dallasopendata.com/browse)
- [Fort Worth Open Data Portal](https://data.fortworthtexas.gov/browse)

