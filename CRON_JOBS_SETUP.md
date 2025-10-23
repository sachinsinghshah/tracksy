# Cron Jobs Setup Guide

This guide covers the automated price checking system that runs periodically to monitor product prices.

## Overview

The price tracker uses **Vercel Cron Jobs** to automatically check product prices at scheduled intervals. The cron job scrapes all active products, updates their prices, records price history, and creates alerts when prices drop below target thresholds.

## How It Works

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Vercel    │      │  Cron API    │      │  Database   │
│  Cron Job   │─────▶│   Endpoint   │─────▶│  (Supabase) │
│  Scheduler  │      │              │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Scraper    │
                     │  (Puppeteer) │
                     └──────────────┘
```

### Workflow:

1. **Vercel triggers** the cron job at scheduled intervals
2. **Endpoint authenticates** the request using CRON_SECRET
3. **Fetches all active products** from the database
4. **Scrapes each product** with rate limiting (3 seconds between requests)
5. **Updates product data** (title, price, image, last_checked)
6. **Records price history** for trend analysis
7. **Creates alerts** when prices drop below target price
8. **Returns summary** of successful/failed checks

## Configuration

### 1. Vercel Cron Job Configuration

The cron schedule is defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

#### Cron Schedule Format

Uses standard cron syntax: `minute hour day month day-of-week`

**Current Schedule:** `0 */6 * * *`

- Runs **every 6 hours**
- At minutes 0 (top of the hour)
- Times: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM (UTC)

#### Common Cron Schedules

```bash
# Every hour
0 * * * *

# Every 3 hours
0 */3 * * *

# Every 6 hours (default)
0 */6 * * *

# Every 12 hours (twice daily)
0 */12 * * *

# Once daily at 2 AM UTC
0 2 * * *

# Twice daily at 8 AM and 8 PM UTC
0 8,20 * * *

# Every weekday at 9 AM UTC
0 9 * * 1-5

# Every Sunday at midnight
0 0 * * 0
```

**⚠️ Important Notes:**

- All times are in **UTC timezone**
- Minimum interval on Vercel is **1 minute** (paid plans)
- Free tier may have limitations on cron frequency
- More frequent checks = more scraping requests = higher chance of being blocked

**Recommended Schedule:**

- **Development/Testing:** Every 12 hours (`0 */12 * * *`)
- **Production (Low Traffic):** Every 6 hours (`0 */6 * * *`)
- **Production (High Traffic):** Every 3-4 hours (`0 */3 * * *`)

### 2. Environment Variables

Add these to your `.env.local` (development) and Vercel dashboard (production):

```bash
# Required: Secure random string for cron authentication
CRON_SECRET=your-secure-random-string-min-32-chars

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Generate CRON_SECRET

**Using OpenSSL (Recommended):**

```bash
openssl rand -hex 32
```

**Using Node.js:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using Online Generator:**

- Visit: https://generate-random.org/api-token-generator
- Length: 64 characters minimum
- Include: Letters + Numbers

**⚠️ Security:**

- Use different secrets for development and production
- Never commit secrets to git
- Store production secrets in Vercel dashboard only
- Rotate secrets periodically (every 90 days)

## API Endpoint

### Endpoint: `/api/cron/check-prices`

**Location:** `src/app/api/cron/check-prices/route.ts`

### Authentication

The endpoint is protected by Bearer token authentication:

```http
POST /api/cron/check-prices
Authorization: Bearer your-cron-secret
```

**Vercel automatically includes this header** when calling cron jobs if `CRON_SECRET` is set.

### Response Format

**Success Response:**

```json
{
  "message": "Price check completed",
  "totalProducts": 15,
  "successful": 14,
  "failed": 1,
  "duration": "52s",
  "errors": [
    {
      "productId": "uuid-here",
      "error": "Product not available"
    }
  ]
}
```

**Error Response:**

```json
{
  "error": "Unauthorized",
  "message": "Invalid cron secret"
}
```

### Rate Limiting

**Built-in Protection:**

- **3 second delay** between each product scrape
- Prevents IP bans from e-commerce sites
- Configurable in `route.ts` (line 156-158)

**Calculation:**

```
Time Required = (Number of Products × 3 seconds) + Scraping Time
Example: 20 products = ~60-90 seconds total
```

**⚠️ Vercel Limits:**

- **Serverless Function Timeout:** 10 seconds (Hobby), 60s (Pro), 300s (Enterprise)
- If you have many products, consider:
  - Upgrading Vercel plan
  - Splitting into batches
  - Increasing check interval

## Deployment Instructions

### Step 1: Set Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
CRON_SECRET=<generated-secure-secret>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
RESEND_API_KEY=<your-resend-key>
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

4. Set environment to: **Production** (or All)
5. Click **Save**

### Step 2: Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Add cron job configuration"
git push origin main

# Vercel will auto-deploy if connected to GitHub
```

### Step 3: Verify Deployment

1. Check deployment logs in Vercel dashboard
2. Confirm `vercel.json` was detected
3. Go to **Settings** → **Cron Jobs**
4. Verify your cron job is listed and scheduled

### Step 4: Monitor First Run

**Cron jobs run on schedule**, so you may need to wait for the first execution.

**To test immediately:**

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Deployments** → **Latest Deployment**
3. Click **Functions** → Find `/api/cron/check-prices`
4. Use the test endpoint (see Testing section below)

## Testing Cron Jobs

### Local Development Testing

**Method 1: Manual HTTP Request**

```bash
# Using curl
curl -X POST http://localhost:3000/api/cron/check-prices \
  -H "Authorization: Bearer your-local-cron-secret"

# Using wget
wget --post-data="" \
  --header="Authorization: Bearer your-local-cron-secret" \
  http://localhost:3000/api/cron/check-prices
```

**Method 2: Using Postman/Insomnia**

1. Create new POST request
2. URL: `http://localhost:3000/api/cron/check-prices`
3. Headers: `Authorization: Bearer your-local-cron-secret`
4. Send request

**Method 3: Using Thunder Client (VS Code)**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/cron/check-prices",
  "headers": {
    "Authorization": "Bearer your-local-cron-secret"
  }
}
```

### Production Testing

**⚠️ Warning:** Use the GET endpoint for testing only (not in production)

The cron endpoint includes a GET handler for manual testing:

```bash
# Test in production
https://your-domain.vercel.app/api/cron/check-prices?secret=your-cron-secret
```

**Recommended:** Disable GET method in production or add IP whitelisting.

### Vercel Dashboard Testing

1. Go to **Vercel Dashboard** → Your Project
2. Navigate to **Cron Jobs**
3. Find your cron job
4. Click **Trigger** (if available on your plan)

## Monitoring & Logs

### View Cron Execution Logs

**Vercel Dashboard:**

1. Go to **Deployments** → **Functions**
2. Filter by `/api/cron/check-prices`
3. View execution logs, errors, and duration

**Realtime Logs (CLI):**

```bash
vercel logs --follow
```

### Log Output Format

```
[Cron] Starting price check job...
[Cron] Found 15 active products to check
[Cron] Processing product 1/15: abc-123-uuid
[Cron] Successfully processed product abc-123-uuid (1/15)
[Cron] Waiting 3 seconds before next product...
[Cron] Processing product 2/15: def-456-uuid
...
[Cron] Job completed: {
  message: "Price check completed",
  totalProducts: 15,
  successful: 14,
  failed: 1,
  duration: "52s"
}
```

### Setting Up Alerts

**Vercel Monitoring:**

1. Go to **Settings** → **Notifications**
2. Enable **Failed Deployments** and **Function Errors**
3. Add email or Slack integration

**Error Tracking (Recommended):**

- Integrate **Sentry** for error tracking
- Add to `src/app/api/cron/check-prices/route.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // ... cron logic
} catch (error) {
  Sentry.captureException(error);
  // ... error handling
}
```

## Troubleshooting

### Common Issues

#### 1. Cron Job Not Running

**Symptoms:** No logs, no price updates

**Solutions:**

- ✅ Verify `vercel.json` is in project root
- ✅ Check cron syntax is valid
- ✅ Ensure project is deployed to Vercel
- ✅ Confirm `CRON_SECRET` is set in Vercel
- ✅ Check Vercel plan supports cron jobs
- ✅ Review deployment logs for errors

#### 2. Unauthorized Error (401)

**Symptoms:** "Unauthorized" in logs

**Solutions:**

- ✅ Verify `CRON_SECRET` matches in:
  - Vercel environment variables
  - `.env.local` (for testing)
- ✅ Check for typos in secret
- ✅ Ensure no extra spaces in secret
- ✅ Redeploy after updating env vars

#### 3. Timeout Errors

**Symptoms:** Function times out before completion

**Solutions:**

- ✅ Reduce number of products being checked
- ✅ Increase delay between requests
- ✅ Upgrade Vercel plan for longer timeouts
- ✅ Split into multiple cron jobs
- ✅ Implement batching:

```typescript
// Check oldest products first
.order("last_checked", { ascending: true, nullsFirst: true })
.limit(10) // Process only 10 per run
```

#### 4. Scraper Blocked/Failed

**Symptoms:** High failure rate, "Failed to scrape" errors

**Solutions:**

- ✅ Increase delay between requests (5-10 seconds)
- ✅ Implement proxy rotation
- ✅ Update user agents
- ✅ Add random delays
- ✅ Reduce scraping frequency

#### 5. Database Connection Errors

**Symptoms:** "Failed to fetch products" errors

**Solutions:**

- ✅ Check Supabase service is running
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- ✅ Test database connection manually
- ✅ Check Supabase RLS policies
- ✅ Review Supabase connection limits

### Debug Mode

Enable detailed logging:

```typescript
// src/app/api/cron/check-prices/route.ts
const DEBUG = process.env.NODE_ENV === "development";

if (DEBUG) {
  console.log("[Debug] Full product data:", product);
  console.log("[Debug] Scraped result:", scrapeResult);
}
```

## Performance Optimization

### Best Practices

1. **Limit Products Per Run**

```typescript
.limit(50) // Don't check more than 50 products at once
```

2. **Prioritize Important Products**

```typescript
// Check products with target prices first
.order("target_price", { ascending: false, nullsLast: true })
```

3. **Skip Recently Checked Products**

```typescript
// Only check products not checked in last 4 hours
.filter((p) => {
  if (!p.last_checked) return true;
  const hoursSince = (Date.now() - new Date(p.last_checked).getTime()) / 3600000;
  return hoursSince >= 4;
})
```

4. **Implement Exponential Backoff**

```typescript
// Already implemented in scrapeAmazonProductWithRetry()
```

5. **Use Connection Pooling**

```typescript
// Supabase client automatically handles this
```

### Scaling Strategies

**For 100+ Products:**

- **Strategy 1:** Multiple cron jobs with product ID ranges
- **Strategy 2:** Queue system (Redis + Bull)
- **Strategy 3:** Separate worker service (Railway, Render)
- **Strategy 4:** Implement pagination in cron job

## Advanced Configuration

### Multiple Cron Jobs

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */6 * * *",
      "description": "Check all active product prices"
    },
    {
      "path": "/api/cron/send-alerts",
      "schedule": "*/15 * * * *",
      "description": "Send email alerts for price drops"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * 0",
      "description": "Weekly cleanup of old data"
    }
  ]
}
```

### Region-Specific Execution

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */6 * * *",
      "region": "iad1"
    }
  ]
}
```

**Available Regions:**

- `iad1` - Washington, D.C., USA
- `sfo1` - San Francisco, USA
- `lhr1` - London, UK
- `fra1` - Frankfurt, Germany
- `sin1` - Singapore

## Security Considerations

### 1. Authentication

✅ **Always use CRON_SECRET** for authentication
✅ **Rotate secrets** every 90 days
✅ **Use different secrets** for dev/staging/prod
✅ **Never expose secrets** in client-side code

### 2. Rate Limiting

✅ **Implement delays** between requests
✅ **Monitor scraping frequency**
✅ **Respect robots.txt** (where applicable)
✅ **Use legitimate user agents**

### 3. Data Protection

✅ **Validate all scraped data** before storing
✅ **Sanitize HTML content**
✅ **Use parameterized queries** (Supabase handles this)
✅ **Enable RLS** on all tables

### 4. Error Handling

✅ **Catch all errors** to prevent crashes
✅ **Log errors** for monitoring
✅ **Return appropriate status codes**
✅ **Don't leak sensitive info** in error messages

## Cost Considerations

### Vercel Pricing

**Hobby Plan (Free):**

- ✅ Cron jobs supported
- ⚠️ 100 GB-hours function execution/month
- ⚠️ 10-second function timeout

**Pro Plan ($20/month):**

- ✅ 1,000 GB-hours function execution/month
- ✅ 60-second function timeout
- ✅ Priority support

**Enterprise:**

- ✅ Custom limits
- ✅ 300-second function timeout
- ✅ SLA guarantees

### Calculation Example

```
Assumptions:
- 50 products tracked
- 3 seconds per product scrape
- Every 6 hours = 4 times/day

Time per execution: 50 × 3 = 150 seconds (2.5 minutes)
Daily execution time: 2.5 × 4 = 10 minutes
Monthly execution time: 10 × 30 = 300 minutes = 5 hours

GB-hours (1GB memory): ~5 GB-hours/month
Status: Well within free tier ✅
```

### Optimization Tips

- Use smaller memory allocation if possible
- Optimize scraper to run faster
- Reduce scraping frequency for less active products
- Implement smart scheduling (check popular products more often)

## Maintenance

### Regular Tasks

**Weekly:**

- ✅ Review cron execution logs
- ✅ Check error rates
- ✅ Monitor scraping success rate

**Monthly:**

- ✅ Review and optimize cron schedule
- ✅ Update scraper selectors if needed
- ✅ Check for blocked IPs
- ✅ Review cost/usage metrics

**Quarterly:**

- ✅ Rotate CRON_SECRET
- ✅ Update dependencies
- ✅ Performance audit
- ✅ Security review

### Health Checks

Create a monitoring endpoint:

```typescript
// /api/health/cron
export async function GET() {
  const { data } = await supabase
    .from("products")
    .select("last_checked")
    .order("last_checked", { ascending: false })
    .limit(1);

  const lastCheck = data?.[0]?.last_checked;
  const hoursSince = lastCheck
    ? (Date.now() - new Date(lastCheck).getTime()) / 3600000
    : null;

  return NextResponse.json({
    status: hoursSince && hoursSince < 7 ? "healthy" : "unhealthy",
    lastCheck,
    hoursSince,
  });
}
```

## Resources

### Official Documentation

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Cron Expression Format](https://crontab.guru/)

### Tools

- [Crontab Guru](https://crontab.guru/) - Cron schedule tester
- [Generate Random](https://generate-random.org/api-token-generator) - Secret generator
- [Postman](https://www.postman.com/) - API testing

### Monitoring Services

- [Sentry](https://sentry.io/) - Error tracking
- [BetterStack](https://betterstack.com/) - Uptime monitoring
- [Cronitor](https://cronitor.io/) - Cron job monitoring

---

## Quick Reference

### Cron Schedule Cheatsheet

```bash
# ┌───────────── minute (0 - 59)
# │ ┌───────────── hour (0 - 23)
# │ │ ┌───────────── day of month (1 - 31)
# │ │ │ ┌───────────── month (1 - 12)
# │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
# │ │ │ │ │
# * * * * *

Every 6 hours:        0 */6 * * *
Every 3 hours:        0 */3 * * *
Daily at 2 AM:        0 2 * * *
Twice daily:          0 8,20 * * *
Every weekday at 9AM: 0 9 * * 1-5
```

### Test Commands

```bash
# Local test
curl -X POST http://localhost:3000/api/cron/check-prices \
  -H "Authorization: Bearer $CRON_SECRET"

# Production test (GET method)
curl https://your-app.vercel.app/api/cron/check-prices?secret=$CRON_SECRET

# View logs
vercel logs --follow

# Generate secret
openssl rand -hex 32
```

---

**Last Updated:** October 23, 2025  
**Version:** 1.0.0
